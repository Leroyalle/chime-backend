export class usersSearchDto {
    search: string
    page: string
    limit: string 
    filterParams: {
        isRecipient: boolean
        isOrderUser: boolean
        isController: boolean
    }


}
