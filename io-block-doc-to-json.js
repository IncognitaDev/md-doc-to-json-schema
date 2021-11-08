const fs = require("fs");

// inserir tabela de propriedades do bloco removendo `
const docTable = `
`;

const propColumn = "Prop name";
const typeColumn = "Type";
const descriptionColumn = "Description";
const defaultValueColumn = "Default value";

// substituir pelo nome do bloco
const blockName = "modal-actions.close";

var tableInJson = require("mdtable2json").getTables(docTable);

console.log(JSON.stringify(tableInJson[0].json));

const getRange = (type) => {
  return `
    "type": "number",
    "min": ${type.split("...")[0]},
    "max": ${type.split("...")[1]}
  `;
};

const getEnum = (type) => {
  const enums = type.split("|");
  const manyTypes = enums.find(
    (enumItem) =>
      enumItem.toLowerCase() == "string" || enumItem.toLowerCase() == "number"
  );
  const types = enums.map((enumItem) => {
    if (
      enumItem.toLowerCase() == "string" ||
      enumItem.toLowerCase() == "number"
    ) {
      return `{"type": "${enumItem.toLowerCase()}"}`;
    }
    if (enumItem.endsWith("[]")) {
      return `{ ${getArrayType(enumItem)} }`;
    }
  });

  if (manyTypes)
    return `
      "anyOf": [
        ${types.map((e) => e)}
      ]
  `;
  return `
  "type": "string",
  "enum": [ ${enums.map((e) => `"${e}"`)}]
  `;
};

const getArrayType = (type) => {
  return `"type": "array", "items": { "type": "${type
    .toLowerCase()
    .replace("[]", "")}" } `;
};

const getType = (type) => {
  const isRanged = type.includes("...");
  const isEnum = type.includes("|");
  const isList = type.endsWith("[]");

  const escapedType = type.toLowerCase() == "enum" ? "string" : type;

  if (isRanged) return getRange(escapedType);
  if (isEnum) return getEnum(escapedType);
  if (isList) return getArrayType(escapedType);
  return `"type": "${escapedType.toLowerCase()}"`;
};

const propsInSchema = tableInJson[0].json.map((prop) => {
  const wrapDefault =
    prop[typeColumn].toLowerCase() == "boolean" ||
    prop[typeColumn].toLowerCase() == "number"
      ? ""
      : '"';
  return `
  "${prop[propColumn]}": {
    ${getType(prop[typeColumn])},
    "description": "${prop[descriptionColumn]}",
    "default":   ${wrapDefault}${prop[defaultValueColumn]
    .replace(/^\"/, "")
    .replace(/\"$/, "")}${wrapDefault}}`;
});

fs.writeFile(
  `${blockName}.schema.json`,
  `
  { 
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "block title",
    "description": "",
    "type": "object",
    "properties": {
      "props": {
        "type": "object",
        "description": "Block's properties",
        "properties": {
          ${propsInSchema.join()}
        }
      }
    }
  }
  `,

  (err) => {
    if (err) {
      console.log(err);
    }
  }
);
