import {gql} from "graphql-tag"
export const typeDefs =  gql` 
  """
    Returns the language, provided the content
  """
  type User {
    id: String,
    displayName: String,
  }
  
  type Output {
    err: Boolean,
    errMsg: String,
    tex: String
    document_id: Int
  }

  type OutputPdf {
    err: Boolean,
    errMsg: String,
    pdf: String
    document_id: Int
  }
  
  type Document {
    pages: String
    name: String
    url: String
    document_id: Int
  }

  type Query {
    UserDetails: User,
    RetrieveDocuments: [Document],
    DocumentByID(document_id: Int!): Document,
  } 
  
  type Mutation {
    CreateTexFile(inputJi: String!, name: String!, pagesData: String!, docID: Int ): Output
    CreatePDF(texFile: String!, docID: Int!): OutputPdf
  }
`;