export interface EntryDto {
  name: string;
  email: string;
  password: string;
}

export interface EntryAdminDto extends EntryDto {
  password: string;
}

export interface ITelegramAuthDto {
  id: number;
  first_name: string;
  username: string;
  photo_url: string;
  auth_date: number;
  hash: string;
}

export interface IGoogleJwtDto {
  clientId: string;
  credential: string;
  select_by: string;
}

export interface IGoogleAuthDto {
  email: string;
  name: string;
  given_name: string;
  picture: string;
}
