SUPER_ADMIN = "super_admin"
ADMIN = "admin"
MANAGER = "manager"
STAFF = "staff"
CUSTOMER = "customer"

ALLOWED_ROLES = {
    SUPER_ADMIN,
    ADMIN,
    MANAGER,
    STAFF,
    CUSTOMER,
}

ADMIN_ROLES = {
    SUPER_ADMIN,
    ADMIN,
}

ROLE_LEVELS = {
    CUSTOMER: 1,
    STAFF: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPER_ADMIN: 5,
}

def is_admin_role(role: str) -> bool:
    return role in ADMIN_ROLES


def is_super_admin(role: str) -> bool:
    return role == SUPER_ADMIN


def get_role_level(role: str) -> int:
    return ROLE_LEVELS.get(role, 0)