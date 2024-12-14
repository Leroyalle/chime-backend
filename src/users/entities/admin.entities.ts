
import { RolesClass } from '../../types/types'
import { AdminDto } from '../dto/create-admin-dto'


export const orgAdminName = 'Admin org'

export const adminData: AdminDto[] = [
    {
        email: 'admin@ahuel.ru',
        password: 'super',
        role: RolesClass.superAdmin,
    },
    {
        email: 'admin@localhost.com',
        password: 'admin1111',
        role: RolesClass.admin,
    },
    {
        email: 'admin2@localhost.com',
        password: 'admin2222',
        role: RolesClass.admin,
    },
    {
        
        email: 'admin3@localhost.com',
        password: 'admin3',
        role: RolesClass.admin,
    },
]