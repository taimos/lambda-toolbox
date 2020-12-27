
export interface PrimaryEntity<P, S> {
  PK: P;
  SK: S;
}

export interface GSI1Entity<P, S> {
  GSI1PK: P;
  GSI1SK: S;
}

export const IndexName_GSI1 = 'GSI1';
