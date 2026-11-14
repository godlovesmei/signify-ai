"""Apply development Google OAuth to this project's isolated local Auth only.

Keeps the old Auth container stopped as a rollback copy. Never resets a database,
changes signing keys, or prints credentials. No CLI/cloud credentials are used.
"""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import http.client
import json
from pathlib import Path
import socket
import time
import tomllib
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, build_opener, HTTPRedirectHandler

ROOT = Path('/home/bunga/signify-supabase-local')
PROJECT = 'signify-supabase-local'
AUTH = 'supabase_auth_' + PROJECT
NETWORK = 'signify-local-only'
API = 'http://127.0.0.1:55431'
CALLBACK = API + '/auth/v1/callback'


class DockerConnection(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(45)
        self.sock.connect('/var/run/docker.sock')


def docker(method, path, body=None):
    connection = DockerConnection('localhost')
    try:
        connection.request(method, '/v1.41' + path,
                           json.dumps(body).encode() if body is not None else None,
                           {'Content-Type': 'application/json'})
        response = connection.getresponse()
        raw = response.read()
        if response.status >= 400:
            raise RuntimeError('Local Docker operation failed (HTTP %d)' % response.status)
        return json.loads(raw) if raw else None
    finally:
        connection.close()


def envfile(path):
    values = {}
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def verify(public_key, client_id):
    opener = build_opener(NoRedirect())
    request = Request(API + '/auth/v1/settings', headers={'apikey': public_key})
    with opener.open(request, timeout=10) as response:
        external = json.load(response)['external']
    assert external.get('google') is True, 'Google provider not active'
    assert external.get('email') is True, 'Email provider must remain active'
    challenge = base64.urlsafe_b64encode(hashlib.sha256(b'local-oauth-routing-probe').digest()).decode().rstrip('=')
    query = urlencode({'provider': 'google', 'redirect_to': 'http://localhost:3000/auth/callback?next=%2Ftranslate',
                       'code_challenge': challenge, 'code_challenge_method': 's256'})
    request = Request(API + '/auth/v1/authorize?' + query, headers={'apikey': public_key})
    try:
        with opener.open(request, timeout=10):
            raise RuntimeError('Expected Google redirect')
    except HTTPError as response:
        assert response.code in (302, 303), 'Authorization did not redirect to Google'
        destination = urlparse(response.headers['Location'])
        parameters = parse_qs(destination.query)
        assert destination.scheme == 'https' and destination.hostname == 'accounts.google.com'
        assert parameters.get('redirect_uri') == [CALLBACK], 'Wrong Google callback'
        assert parameters.get('client_id') == [client_id], 'Wrong development client'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true', help='Replace only local Auth with rollback protection')
    args = parser.parse_args()
    config = tomllib.loads((ROOT / 'supabase/config.toml').read_text())
    assert config['project_id'] == PROJECT and config['api']['port'] == 55431
    google = config['auth']['external']['google']
    assert google['enabled'] and google['redirect_uri'] == CALLBACK
    assert google['client_id'] == 'env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)'
    assert google['secret'] == 'env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)'
    values = envfile(ROOT / '.env')
    client_id = values.get('SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID', '')
    secret = values.get('SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET', '')
    assert client_id.endswith('.apps.googleusercontent.com') and secret, 'Development credentials required'
    assert not any(c.isspace() for c in client_id + secret), 'Unexpected credential whitespace'
    frontend = envfile(Path(__file__).resolve().parents[2] / 'apps/frontend/.env.local')
    assert frontend['NEXT_PUBLIC_SUPABASE_URL'] == API
    public_key = next(frontend[k] for k in ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
                      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] if frontend.get(k))
    old = docker('GET', '/containers/' + AUTH + '/json')
    assert old['Config']['Labels']['com.supabase.cli.project'] == PROJECT
    assert list(old['NetworkSettings']['Networks']) == [NETWORK]
    assert old['HostConfig']['NetworkMode'] == NETWORK
    assert not old['Mounts'] and not old['HostConfig'].get('Binds')
    current = dict(entry.split('=', 1) for entry in old['Config']['Env'])
    assert current.get('GOTRUE_EXTERNAL_EMAIL_ENABLED') == 'true'
    desired = dict(current)
    desired.update({'GOTRUE_EXTERNAL_GOOGLE_ENABLED': 'true',
                    'GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID': client_id,
                    'GOTRUE_EXTERNAL_GOOGLE_SECRET': secret,
                    'GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI': CALLBACK,
                    'GOTRUE_SITE_URL': config['auth']['site_url'],
                    'GOTRUE_URI_ALLOW_LIST': ','.join(config['auth']['additional_redirect_urls'])})
    print('Local project, development credentials, callbacks and email fallback: validated (values hidden).')
    if not args.apply:
        return
    if desired == current:
        verify(public_key, client_id)
        print('Google already configured; email and Google redirect checks passed.')
        return
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = AUTH + '_before_google_' + stamp
    network = old['NetworkSettings']['Networks'][NETWORK]
    endpoint = {'Aliases': network.get('Aliases') or [],
                'IPAMConfig': {'IPv4Address': network['IPAddress']}}
    body = dict(old['Config'])
    body['Env'] = [key + '=' + value for key, value in desired.items()]
    body['HostConfig'] = old['HostConfig']
    body['NetworkingConfig'] = {'EndpointsConfig': {NETWORK: endpoint}}
    renamed = disconnected = False
    replacement = None
    try:
        docker('POST', '/containers/' + old['Id'] + '/stop?t=20')
        docker('POST', '/containers/' + old['Id'] + '/rename?name=' + backup)
        renamed = True
        docker('POST', '/networks/' + NETWORK + '/disconnect', {'Container': old['Id'], 'Force': True})
        disconnected = True
        replacement = docker('POST', '/containers/create?name=' + AUTH, body)['Id']
        docker('POST', '/containers/' + replacement + '/start')
        for attempt in range(30):
            try:
                verify(public_key, client_id)
                break
            except Exception:
                if attempt == 29:
                    raise RuntimeError('Local OAuth verification failed; restoring previous Auth') from None
                time.sleep(1)
        print('PASS: Google enabled, email enabled, Google authorization redirects to accounts.google.com.')
        print('PASS: Google callback and development client match; no tokens or secrets printed.')
        print('Rollback container retained (stopped): ' + backup)
    except Exception:
        if replacement:
            docker('POST', '/containers/' + replacement + '/stop?t=10')
            docker('POST', '/networks/' + NETWORK + '/disconnect', {'Container': replacement, 'Force': True})
            docker('POST', '/containers/' + replacement + '/rename?name=' + AUTH + '_failed_' + stamp)
        if disconnected:
            docker('POST', '/networks/' + NETWORK + '/connect', {'Container': old['Id'], 'EndpointConfig': endpoint})
        if renamed:
            docker('POST', '/containers/' + old['Id'] + '/rename?name=' + AUTH)
        docker('POST', '/containers/' + old['Id'] + '/start')
        raise RuntimeError('Activation failed; previous local Auth restored. Credentials were not logged.') from None


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Avoid traceback/local values from external libraries containing credentials.
        print('ERROR: local OAuth configuration/activation did not finish; secret values suppressed.')
        raise SystemExit(1)
