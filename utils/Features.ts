import { FilterQuery, Query } from "mongoose";
import { ProductDocument } from "../models/product"; // Adjust path and type as per your actual schema

interface QueryString {
  s?: string;
  [key: string]: any;
}

export class Features {
  private query: Query<ProductDocument[], ProductDocument>;
  private queryStr: QueryString;

  constructor(
    query: Query<ProductDocument[], ProductDocument>,
    queryStr: QueryString
  ) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search(): Query<ProductDocument[], ProductDocument> {
    const searchTerm = this.queryStr.s;

    const filter: FilterQuery<ProductDocument> = searchTerm
      ? {
          $or: [
            { title: { $regex: searchTerm, $options: "i" } },
            { productno: { $regex: searchTerm, $options: "i" } },
            { desc: { $regex: searchTerm, $options: "i" } },
            { categories: { $in: [searchTerm] } },
          ],
        }
      : {};

    this.query = this.query.find(filter);
    return this.query;
  }
}
