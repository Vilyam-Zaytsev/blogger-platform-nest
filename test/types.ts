export type AdminCredentials = {
  login: string;
  password: string;
};

export type SearchFilter = {
  searchLoginTerm?: string;
  searchEmailTerm?: string;
  searchNameTerm?: string;
};
