import { Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  parentId?: string;
  status?: boolean;
}

export interface CategoryProps extends ICategory {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}
