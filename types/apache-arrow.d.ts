declare module 'apache-arrow' {
  export interface Field { name: string }
  export interface Schema { fields: Field[] }
  export interface Table {
    schema: Schema;
    numRows: number;
    get(index: number): any;
    toString(): string;
  }
}

