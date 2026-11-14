from datetime import datetime
from uuid import UUID
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ContributionInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    proposed_label_id: UUID | None = None
    proposed_label_text: str | None = Field(default=None, min_length=1, max_length=160)
    consent: bool
    consent_version: str = Field(min_length=1, max_length=100)
    recognition_event_id: UUID | None = None

    @model_validator(mode="after")
    def complete(self):
        if not self.consent or not self.consent_version.strip():
            raise ValueError("Persetujuan penggunaan data wajib diberikan.")
        if self.proposed_label_text is not None:
            self.proposed_label_text = self.proposed_label_text.strip()
        if not self.proposed_label_id and not self.proposed_label_text:
            raise ValueError("Pilih label atau isi usulan label.")
        return self


class VideoPolicy(BaseModel):
    id: UUID
    version: str
    min_duration_ms: int = Field(gt=0)
    max_duration_ms: int = Field(gt=0)
    min_short_side_px: int = Field(gt=0)
    max_long_side_px: int = Field(gt=0)
    max_size_bytes: int = Field(gt=0)
    allowed_mime_types: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def ordered(self):
        if self.min_duration_ms > self.max_duration_ms or self.min_short_side_px > self.max_long_side_px:
            raise ValueError("Policy inconsistent")
        return self


class ContributionReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_revision: int = Field(gt=0)
    decision: Literal["APPROVED", "REJECTED"]
    final_label_id: UUID | None = None
    reason: str | None = Field(default=None, max_length=2000)
    final_label_text: str | None = Field(default=None, min_length=1, max_length=160)

    @model_validator(mode="after")
    def complete(self):
        self.reason = self.reason.strip() if self.reason else None
        self.final_label_text = self.final_label_text.strip() if self.final_label_text else None
        if self.decision == "REJECTED" and (not self.reason or self.final_label_id is not None or self.final_label_text):
            raise ValueError("Alasan penolakan wajib diisi; label final tidak boleh diberikan.")
        if self.decision == "APPROVED" and (bool(self.final_label_id) == bool(self.final_label_text)):
            raise ValueError("Persetujuan wajib memilih label final.")
        return self


class CuratorGrantInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str = Field(min_length=3, max_length=254)
    qualification_note: str = Field(min_length=1, max_length=2000)

    @model_validator(mode="after")
    def complete(self):
        self.email = self.email.strip().lower()
        self.qualification_note = self.qualification_note.strip()
        if "@" not in self.email or not self.qualification_note:
            raise ValueError("Email dan catatan kompetensi wajib diisi.")
        return self


class CuratorRevokeInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_granted_at: datetime
