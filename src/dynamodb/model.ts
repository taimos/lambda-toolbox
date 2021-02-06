
export interface PrimaryEntity<P, S> {
  PK: P;
  SK: S;
}

export interface GSI1Entity<P, S> {
  GSI1PK: P;
  GSI1SK: S;
}

export const IndexName_GSI1 = 'GSI1';
export const IndexName_GSI1_PK = 'GSI1PK';
export const IndexName_GSI1_SK = 'GSI1SK';

export const Primary_PK = 'PK';
export const Primary_SK = 'SK';
