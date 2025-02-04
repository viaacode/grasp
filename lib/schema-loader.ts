import fs from 'fs';
import { ObjectTypeDefinitionNode, DocumentNode, UnionTypeDefinitionNode } from 'graphql';
import { join } from 'path';
import { parse } from 'graphql/language/parser.js';
import logger from "./logger.js";

const {readdir, readFile} = fs.promises;

export default class SchemaLoader {
  originalTypeDefs: DocumentNode;
  queryDef: ObjectTypeDefinitionNode;
  resourceTypeDefs: ObjectTypeDefinitionNode[];
  unionTypeDefs: UnionTypeDefinitionNode[];

  constructor(schema: string) {
    try {
      this.originalTypeDefs = parse(schema);
    } catch (error) {
      logger.error(error)
      throw new Error('GraphQL schema is either invalid or not found. Make sure you have a correct RESOURCES_DIR environment variable set');
    }
    
    const typeDefinitionNodes = this.originalTypeDefs.definitions.filter((def): def is ObjectTypeDefinitionNode => {
      return def.kind === 'ObjectTypeDefinition';
    });

    this.unionTypeDefs = this.originalTypeDefs.definitions.filter((def): def is UnionTypeDefinitionNode => {
      return def.kind === 'UnionTypeDefinition';
    });

    const queryDef = typeDefinitionNodes.filter(def => def.name.value === 'Query');
    if (!queryDef || queryDef.length < 1) {
      throw new Error('Query is not defined');
    }
    if (queryDef.length > 1) {
      throw new Error('Multiple definitions of Query found');
    }
    this.queryDef = queryDef[0];

    this.resourceTypeDefs = typeDefinitionNodes.filter(def => def.name.value !== 'Query');
  }

  /**
   * Read all GraphQL schema files in resources directory and concatenate to a single schema string
   * 
   * @param baseDir Resources directory with graphql schema files
   * @returns SchemaLoader object as promise
   */
  static async loadFromDirectory(baseDir: string): Promise<SchemaLoader> {
    let schema = '';

    const files = await readdir(baseDir)

    for (const path of files) {
      if (!/^[0-9a-zA-Z].*\.graphql$/.test(path)) { continue; }

      schema += await readFile(join(baseDir, path), {encoding: 'utf-8'});
    }

    return new SchemaLoader(schema);
  }

  /**
   * Read GraphQL schema from a single schema file
   * 
   * @param baseDir Resources directory with graphql schema files
   * @returns SchemaLoader object as promise
   */
     static async loadFromFile(path: string): Promise<SchemaLoader> {
      let schema: string = await readFile(path, {encoding: 'utf-8'});
  
      return new SchemaLoader(schema);
    }
}
