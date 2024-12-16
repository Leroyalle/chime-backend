import { Prisma } from "@prisma/client"

export class RolesClass {
    static readonly user: string = 'user'
    static readonly admin: string = 'admin'
    static readonly superAdmin: string = 'superAdmin'
}

export type UserId = string | number


export interface IBasicUser {
    id: string,
    role: string,

    EmailUser?,
    TelegramUser?,
    GoogleUser?
}


// ______
export enum GameTypes {
    game = 'game',
    app= 'app',

}



// export interface ITelegramAuth {
//     id: number;
//     first_name: string;
//     username: string;
//     photo_url: string;
//     auth_date: number;
//     hash: string;
// }




