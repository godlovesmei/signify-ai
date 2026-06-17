import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'lib/authRedirect.ts',
        'lib/serializedQueue.ts',
        'lib/supabaseRetry.ts',
        'lib/translateApi.ts',
        'lib/translateState.ts',
        'lib/userData.ts',
        'lib/yoloPostprocess.ts',
        'lib/yoloPreprocess.ts',
        'components/auth/LoginModal.tsx',
        'components/features/translation/DeleteControls.tsx',
        'components/features/translation/SentenceBuilder.tsx',
        'components/tts/TTSButton.tsx',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'tests/**',
        'utils/supabase/database.types.ts',
        'app/(documentation)/**',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'next/navigation': 'next/navigation.js',
      'next/server': 'next/server.js',
    },
  },
});
