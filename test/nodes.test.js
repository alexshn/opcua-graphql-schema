const { expect } = require("chai");
const { NodeClass } = require("node-opcua-data-model");
const { typeDefs, resolvers } = require("../src/nodes.js");


describe("Nodes", function() {

  describe("TypeDefs", function() {
    it("should have only expected definitions", function() {
      typeDefs.definitions.map(def => {
        expect(def.kind).to.be.oneOf([
          "ObjectTypeDefinition",
          "InterfaceTypeDefinition"
        ]);
      });
    });

    it("should define only known Interface types", function() {
      const interfaces = typeDefs.definitions.reduce((result, def) => {
        def.kind === "InterfaceTypeDefinition" && result.push(def.name.value);
        return result;
      }, []);

      expect(interfaces).to.have.members([
        "Base"
      ]);
    });

    it("should define only known Object types", function() {
      const objects = typeDefs.definitions.reduce((result, def) => {
        def.kind === "ObjectTypeDefinition" && result.push(def.name.value);
        return result;
      }, []);

      expect(objects).to.have.members([
        "Query",
        "Object"
      ]);
    });
  });


  describe("Query", function() {
    it("should have query resolvers", function() {
      expect(resolvers.Query.node).to.be.a('function');
      expect(resolvers.Query.nodes).to.be.a('function');
    });
  });

  describe("Base", function() {
    it("should resolve Node type", function() {
      NodeClass.enums.filter(item => item.value > 0).forEach(item => {
        const object = {nodeClass: item.value};
        expect(resolvers.Base.__resolveType(object)).to.equal(item.key);
      });

      // All unexpected resolved to Base
      expect(resolvers.Base.__resolveType({})).to.equal("Base");
      expect(resolvers.Base.__resolveType({nodeClass: null})).to.equal("Base");
      expect(resolvers.Base.__resolveType({nodeClass: NodeClass.get("Unspecified")})).to.equal("Base");
    });
  });

});
