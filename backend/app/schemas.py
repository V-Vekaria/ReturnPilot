from typing import Literal

from pydantic import BaseModel, Field


IssueType = Literal["damaged_item", "disputed_delivery", "change_of_mind"]


class ComplaintCreate(BaseModel):
    order_id: str
    issue_type: IssueType
    description: str = Field(min_length=10, max_length=2000)


class ApprovalRequest(BaseModel):
    decision: Literal["approve", "reject"]
    note: str = Field(default="", max_length=1000)
