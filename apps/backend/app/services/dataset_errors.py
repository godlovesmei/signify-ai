"""Safe public errors. Raw upstream bodies, JWTs and signed URLs are never echoed."""


class DatasetError(Exception):
    def __init__(self, status: int, code: str, message: str, retryable: bool = False, *, details: dict | None = None):
        self.status, self.code, self.message, self.retryable = status, code, message, retryable
        self.details = details
        super().__init__(code)


def upstream_error(status: int, body: dict, operation: str = "") -> DatasetError:
    code = body.get("code")
    # Existing RPCs intentionally RAISE 40001 for stale revisions. Do not confuse
    # that business condition with arbitrary PostgreSQL serialization failures.
    if (code == "40001" and body.get("message") == "Contribution revision changed"
            and operation in ("dataset_review_contribution", "dataset_soft_delete_contribution")):
        return DatasetError(409, "candidate_revision_conflict", "Kandidat telah berubah; muat ulang datanya.")
    if code == "40001" and operation == "dataset_curator_access":
        return DatasetError(409, "curator_access_changed", "Akses kurator telah berubah; muat ulang daftar.")
    if code == "22023" and operation == "dataset_curator_access":
        return DatasetError(422, "invalid_curator_assignment", "Gunakan email akun non-admin yang sudah terdaftar dan isi catatan kompetensinya.")
    if code == "40001":
        return DatasetError(503, "database_serialization_failure", "Transaksi belum dapat diselesaikan.", True)
    if code == "22023" and operation == "dataset_review_contribution":
        return DatasetError(422, "invalid_review", "Keputusan, label final, atau alasan penolakan tidak valid.")
    if status in (401, 403) or code == "42501":
        return DatasetError(403, "operation_forbidden", "Akses tidak diizinkan.")
    if code == "23514":
        return DatasetError(409, "policy_or_state_changed", "Policy atau keadaan data telah berubah.")
    if code in ("23503", "23505"):
        return DatasetError(409, "data_conflict", "Data bertentangan dengan catatan yang sudah ada.")
    return DatasetError(503, "upstream_unavailable", "Layanan penyimpanan belum tersedia.", True)
