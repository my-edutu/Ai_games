from pydantic import BaseModel, Field

class FieldValue(BaseModel):
    value: str | float | None
    confidence: float = Field(ge=0, le=1)
    source_text: str | None = None

class DocumentInput(BaseModel):
    document_id: str = Field(min_length=1)
    vendor_template: str = Field(min_length=1)
    raw_text: str = Field(min_length=1)
    parser_version: str = Field(min_length=1, default="parser-v1")

class ExpenseRecord(BaseModel):
    document_id: str
    vendor: FieldValue
    date: FieldValue
    currency: FieldValue
    subtotal: FieldValue
    tax: FieldValue
    total: FieldValue
    category: FieldValue
    needs_review: bool
    validation_errors: list[str] = []
    duplicate_of: str | None = None
