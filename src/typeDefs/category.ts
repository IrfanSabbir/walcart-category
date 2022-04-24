const { gql } = require("apollo-server-express");

export default gql`
  scalar Date
  scalar JSON

  type Category {
    _id: ID!
    name: String!
    parentId: JSON
    status: Boolean
    createdAt: Date!
    updatedAt: Date!
  }

  type AllChieldResult {
    parent: Category
    chields: [Category]
  }

  input inputCategory {
    name: String!
    status: Boolean
    parentId: ID
  }

  input updateCategory {
    id: ID!
    name: String
    status: Boolean
  }

  type Query {
    listCategory: [Category!]
    searchCategory(name: String!): Category
    getAllchieldCategory(id: ID!): AllChieldResult
  }

  type Mutation {
    createCategory(input: inputCategory!): Category!
    updateCategory(input: updateCategory!): Category!
    deleteCategory(id: ID!): Category
  }
`;
