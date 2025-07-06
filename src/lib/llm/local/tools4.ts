// import { type Tool } from "openai/resources/responses/responses.mjs";

// export const tools4: Tool[] = [
//   // Node-level
//   {
//     type: "function",
//     name: "get_node_main_file",
//     description: "Get the main file content for a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" } }, required: ["nodeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_node_helper_files",
//     description: "Get all helper file contents for a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" } }, required: ["nodeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_node_test_files",
//     description: "Get all test file contents for a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" } }, required: ["nodeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_node_comment",
//     description: "Get the comment/description for a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" } }, required: ["nodeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_node_history",
//     description: "Get the history for a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["nodeId"] },
//     strict: true
//   },

//   // Edge-level
//   {
//     type: "function",
//     name: "get_edge_interface_file",
//     description: "Get the interface/stub file content for an edge.",
//     parameters: { type: "object", properties: { edgeId: { type: "string" } }, required: ["edgeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_edge_contract",
//     description: "Get the contract file content for an edge.",
//     parameters: { type: "object", properties: { edgeId: { type: "string" } }, required: ["edgeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_edge_comment",
//     description: "Get the comment/description for an edge.",
//     parameters: { type: "object", properties: { edgeId: { type: "string" } }, required: ["edgeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "get_edge_history",
//     description: "Get the history for an edge.",
//     parameters: { type: "object", properties: { edgeId: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["edgeId"] },
//     strict: true
//   },

//   // Graph navigation
//   {
//     type: "function",
//     name: "list_connected_edges",
//     description: "List all edge IDs connected to a node.",
//     parameters: { type: "object", properties: { nodeId: { type: "string" } }, required: ["nodeId"] },
//     strict: true
//   },
//   {
//     type: "function",
//     name: "list_connected_nodes",
//     description: "Get the source and target node IDs for an edge.",
//     parameters: { type: "object", properties: { edgeId: { type: "string" } }, required: ["edgeId"] },
//     strict: true
//   },

//   // Graph overview
//   {
//     type: "function",
//     name: "get_graph_overview",
//     description: "Get a summary of all node and edge IDs in the graph.",
//     parameters: { type: "object", properties: {}, required: [] },
//     strict: true
//   }
// ];
