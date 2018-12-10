const { expect } = require("chai");
const { NodeClass } = require("node-opcua-data-model");
const { typeDefs, resolvers } = require("../src/nodes.js");


describe("Nodes", function() {

  describe("TypeDefs", function() {
    it("should have only expected definitions", function() {
      typeDefs.definitions.map(def => {
        expect(def.kind).to.be.oneOf(["ObjectTypeDefinition", "InterfaceTypeDefinition"]);
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
    it("should return node through readAllAttributes", function() {
      const object = {nodeId: "test", browseName: "testText"};
      const args = {nodeId: "test"};
      const context = {opcua: {session: {
        readAllAttributes: id => {
          expect(id).to.equal(args.nodeId);
          return object;
        }
      }}};

      expect(resolvers.Query.node(null, args, context)).to.deep.equal(object);
    });

    it("should return nodes through readAllAttributes", function() {
      const object = {nodeId: "test", browseName: "testText"};
      const args = {nodeIds: ["test", "test2"]};
      const context = {opcua: {session: {
        readAllAttributes: ids => {
          expect(ids).to.deep.equal(args.nodeIds);
          return [object];
        }
      }}};

      expect(resolvers.Query.nodes(null, args, context)).to.deep.equal([object]);
    });
  });


  describe("Base", function() {
    it("should resolve Node type", function() {
      NodeClass.enums.forEach(item => {
        const object = {nodeClass: item.value};
        expect(resolvers.Base.__resolveType(object)).to.equal(item.key);
      });
    });
  });

});
