export interface PageInfo {
  hasPreviousPage: boolean
  hasNextPage: boolean
  startCursor: string
  endCursor: string
}

export interface Usager {
  email: string
}

export interface DossierNode {
  id: string
  state: string
  dateDepot: string
  dateDerniereModification: string
  usager: Usager
}

export interface DossiersResponse {
  pageInfo: PageInfo
  nodes: DossierNode[]
}

export interface Demarche {
  id: string
  title: string
  dossiers: DossiersResponse
}

export interface GraphQLResponse {
  data: {
    demarche: Demarche
  }
}
