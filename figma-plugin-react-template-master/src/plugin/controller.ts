
figma.showUI(__html__, {width: 300, height: 400});

let allText = []
let countOfThis = 0
var textDict = {}
let nodeDict = []

let minX = 0
let minY = 0

for (const node of figma.currentPage.selection) {
    if(node.type == "STICKY") {
        countOfThis++;
        textDict[node.text.characters] = node.id
        nodeDict.push(node.id)
        allText.push(node.text.characters);

        if(textDict.length == 1) {
            minX = node.x
            minY = node.y
            continue
        }
        if(node.x < minX) {
            minX = node.x
        }
        if(node.y < minY) {
            minY = node.y
        }
    }
}
// alert(allText);
console.log(textDict);
figma.ui.postMessage({
    type: 'stickySentences',
    message: textDict,
});



figma.ui.onmessage = (msg) => {
    console.log(msg);
    if(msg.type === 'groupsIdentified') {
        console.log("groupIdentified" + msg.groups);
        console.log(nodeDict)
        let colorValueR = 0.1;
        let colorValueG = 0.1;
        let colorValueB = 0.1;
        // let minX = 0;
        for (let group of msg.groups) {
            console.log(group);
            let colorValueR = Math.random()
            let colorValueG = Math.random()
            let colorValueB = Math.random()
            // colorValue = Math.random()
            for(let i in group) {
                console.log(group[i]);
                let thatNode = figma.currentPage.findOne(n => n.id === nodeDict[group[i]])
                thatNode.fills = [{type: 'SOLID', color: {r: colorValueR, g: colorValueB, b: colorValueG}}];
                
            }
            console.log("Min X: " + minX)
            console.log("Min Y: " + minY)
            let xOffset = 0;
            let maxWidth = 0;
            let groupX = minX;
            let groupY = minY;
            for(let i in group) {
                let thatNode = figma.currentPage.findOne(n => n.id === nodeDict[group[i]])
                thatNode.x = groupX
                thatNode.y = groupY
                groupY += thatNode.height

                if (thatNode.width > maxWidth) {
                    maxWidth = thatNode.width
                    if(i<5) {
                        xOffset = maxWidth
                    }
                }
                if(i % 5 == 0 && i > 0) {
                    groupX += maxWidth
                    groupY = minY
                    xOffset += maxWidth
                    maxWidth = 0
                }
            }

            minX += xOffset + 10
        }
    }
    figma.closePlugin();
};
