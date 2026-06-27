from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"
    MANUFACTURER = "manufacturer"
    RETAILER = "retailer"


class CompanyType(StrEnum):
    MANUFACTURER = "manufacturer"
    RETAILER = "retailer"
    DISTRIBUTOR = "distributor"
    WHOLESALER = "wholesaler"


class RFQStatus(StrEnum):
    DRAFT = "draft"
    OPEN = "open"
    CLOSED = "closed"
    AWARDED = "awarded"


class QuoteStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
