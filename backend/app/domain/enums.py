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
