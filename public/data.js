const data = {
  nodes: [],
  edges: []
}

const rootNodes = []
const childNodes = []

const rootLength = 2

for (let i = 0; i < rootLength; i++) {
  rootNodes.push({
    id: `TERMINAL-${i}`,
    label: "Garcia",
    properties: {
      gender: "male",
    },
    facade: {
      tooltip: [ 'birthday', 'gender' ]
    }
  })
}

const childLength = rootLength * 100

for (let i = 0; i < childLength; i++) {
  childNodes.push({
    id: `Phone-${i}`,
    label: "phone",
    properties: {
      gender: "male",
    },
    facade: {
      tooltip: [ 'birthday', 'gender' ]
    },
    shape: "circle-node"
  })
}

const edges = []
const map = new Map()
rootNodes.map(node => map.set(node.id, 0))

childNodes.map((node, index) => {
  const source = `TERMINAL-${Math.floor(Math.random() * rootLength)}`
  if (map.get(source) < 70) {
    const val = map.get(source) + 1
    map.set(source, val)
    edges.push({
      id: Math.random() * new Date().getTime(),
      label: "workAt",
      source: source,
      target: node.id,
      shape: "circle-edge"
    })
  } else {
    // if (index > childNodes.length - 2) {
    //   return
    // }
    // edges.push({
    //   id: Math.random() * new Date().getTime(),
    //   label: "workAt",
    //   source: childNodes[index].id,
    //   target: childNodes[index + 1].id,
    //   shape: "circle-edge"
    // })
  }
})

data.nodes = [...rootNodes, ...childNodes]
data.edges = edges


module.exports = data
