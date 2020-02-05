import { ObjectTypeDefinitionNode, TypeNode } from 'graphql';

import Resource from './resource';
import { unwrapCompositeType } from './utils';

export default class Resources {
  all: Array<Resource>;

  constructor(resourceTypeDefs: ObjectTypeDefinitionNode[]) {
    this.all = resourceTypeDefs.map(def => Resource.buildFromTypeDefinition(this, def));
  }

  get root(): Array<Resource> {
    return this.all.filter(resource => resource.isRootType)
  }

  lookup(name: string): Resource {
    const resource = this.all.find((resource: Resource) => resource.definition.name.value === name);

    if (!resource) {
      throw new Error(`resource ${name} not found`);
    }

    return resource;
  }

  isUserDefined(type: TypeNode): boolean {
    const unwrapped = unwrapCompositeType(type);

    return this.all.some(resource => resource.definition.name.value === unwrapped.name.value);
  }
}
