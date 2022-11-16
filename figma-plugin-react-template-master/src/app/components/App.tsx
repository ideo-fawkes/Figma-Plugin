import { callbacks } from '@tensorflow/tfjs';
import * as React from 'react';
import '../styles/ui.css';
// import rangeSlider from 'range-slider-input';
// import 'range-slider-input/dist/style.css';
const Color = require('color');
require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');



const App = ({}) => {
  const sentences = [
    'Will it snow tomorrow?',
    'Recently a lot of hurricanes have hit the US',
    'Global warming is real',
    
    'An apple a day, keeps the doctors away',
    'Eating strawberries is healthy',
    
    'what is your age?',
    'How old are you?',
    'How are you?',
    
    'The dog bit Johnny',
    'Johnny bit the dog',
    
    'The cat ate the mouse',
    'The mouse ate the cat' 
    
];
let sentenceToNodeKeyDict = {}
let sentenceGroupDict = {}
let sensitivityVal = 0.5

  function setSensitivity(val) {
    sensitivityVal = val/100 
  }

  function runModel(stickySentences, callback) {
    // Load the model.
        use.load().then(model => {
            // Embed an array of sentences.
            model.embed(stickySentences).then(embeddings => {
            // `embeddings` is a 2D tensor consisting of the 512-dimensional embeddings for each sentence.
            // So in this example `embeddings` has the shape [2, 512].
              embeddings.print(true /* verbose */);
            //   return embeddings;
            callback(embeddings)
            });
      });
    }
    
    function dot(a, b){
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var sum = 0;
        for (var key in a) {
          if (hasOwnProperty.call(a, key) && hasOwnProperty.call(b, key)) {
            sum += a[key] * b[key]
          }
        }
        return sum
      }
    
    function similarity(a, b) {
        var magnitudeA = Math.sqrt(dot(a, a));
        var magnitudeB = Math.sqrt(dot(b, b));
        if (magnitudeA && magnitudeB)
          return dot(a, b) / (magnitudeA * magnitudeB);
        else return false
    }
    
    function cosine_similarity_matrix(matrix){
        let cosine_similarity_matrix = [];
        for(let i=0;i<matrix.length;i++){
            console.log(matrix[i])
            let row = [];
            for(let j=0;j<i;j++){
              row.push(cosine_similarity_matrix[j][i]);
            }
            row.push(1);
            for(let j=(i+1);j<matrix.length;j++){
              row.push(similarity(matrix[i],matrix[j]));
            }
            cosine_similarity_matrix.push(row);
        }
        return cosine_similarity_matrix;
    }
    
    function form_groups(cosine_similarity_matrix){
        let dict_keys_in_group = {};
        let groups = [];
    
        for(let i=0; i<cosine_similarity_matrix.length; i++){
          var this_row = cosine_similarity_matrix[i];
          for(let j=i; j<this_row.length; j++){
            if(i!=j){
              let sim_score:number = cosine_similarity_matrix[i][j];
              console.log("Sensitivity threshold " + sensitivityVal)
              if(sim_score > sensitivityVal){
    
                let group_num: number;
    
                if(!(i in dict_keys_in_group)){
                  group_num = groups.length;
                  dict_keys_in_group[i] = group_num;
                }else{
                  group_num = dict_keys_in_group[i];
                }
                if(!(j in dict_keys_in_group)){
                  dict_keys_in_group[j] = group_num;
                }
    
                if(groups.length <= group_num){
                  groups.push([]);
                }
                groups[group_num].push(i);
                groups[group_num].push(j);
              }
            }
          }
        }
    
        let return_groups = [];
        for(var i in groups){
          return_groups.push(Array.from(new Set(groups[i])));
        }
    
        console.log(return_groups);
        return return_groups;
      }

    function averageEmbedding(matrix) {
      for(let i=0;i<matrix.length;i++){
          let average = 0
          let count = 0
          for(let j=0; j<matrix[i].length;j++) {
            // console.log(matrix[i][j])
            average += matrix[i][j];
            count++;
          }
          average = average / matrix.length
          // console.log(average)
        }
    }
    
    declare function require(path: string): any;
    
    async function get_similarity(list_sentences){
    
        let callback = function(embeddings) {
    
            console.log("embeddings", embeddings);

            averageEmbedding(embeddings.arraySync());
      
            let cosine_similarity_matrixs = cosine_similarity_matrix(embeddings.arraySync());
            console.log("Cosine similarity")
            console.log(cosine_similarity_matrixs);
      
            let groups = form_groups(cosine_similarity_matrixs);
    
            parent.postMessage({pluginMessage: {type: 'groupsIdentified', groups}}, '*')
    
            // this.analyzing_text = false
            for(let i in groups){
                console.log("Group: " + i);
                for(let j in groups[i]){
                    console.log(groups[i][j], list_sentences[ groups[i][j] ])
                }
            }
          };
      
        //   this.analyzing_text = true;
          let embeddings = await runModel(list_sentences, callback.bind(this));
      
        }

  interface FigProps {
    sliderValue: number;
  }
  
  let [sliderValue] = React.useState<number>(50);
    const textbox = React.useRef<HTMLInputElement>(undefined);
    let stickySentences = [];
    // let sliderValue = 50

    const slideRef = React.useCallback((element: HTMLInputElement) => {
        // if (element) element.value = '50';
        // textbox.current = element;
        console.log(element)
    }, []);

    const onCreate = () => {
        // const count = parseInt(textbox.current.value, 10);
        // parent.postMessage({pluginMessage: {type: 'create-rectangles', count}}, '*');
        // parent.postMessage({pluginMessage: {type: 'stickySentences', stickySentences}}, '*');
        // console.log(stickySentences.length)
        // runModel(stickySentences);
        get_similarity(stickySentences);
        console.log("Figma saved: " + stickySentences);
        console.log(sentenceToNodeKeyDict);
    };

    const onSlide = (e: React.ChangeEvent<HTMLButtonElement>) => {
        // parent.postMessage({pluginMessage: {type: 'cancel'}}, '*');
        console.log(e.target.value)
        setSensitivity(e.target.value);
        sliderValue = e.target.value
    };

    React.useEffect(() => {
        // This is how we read messages sent from the plugin controller
        window.onmessage = (event) => {
            const {type, message} = event.data.pluginMessage;
            if (type === 'create-rectangles') {
                console.log(`Figma Says: ${message}`);
            } else if (type === 'stickySentences') {
                console.log("Figma says: " + message);
                let newArray = []
                for(var key in message) {
                    console.log(key + " : " + message[key]);
                    newArray.push(key);
                }
                stickySentences = newArray;
                sentenceToNodeKeyDict = message;
            }
        };
    }, []);

    return (
        <div>
            <img src={require('../assets/logo.svg')} />
            {/* <svg width="264" height="104" viewBox="0 0 264 104" fill="none" xmlns="http://www.w3.org/2000/svg">
<g filter="url(#filter0_d_106_361)">
<g clip-path="url(#clip0_106_361)">
<rect x="8" y="6" width="248" height="88" rx="8" fill="#F0F0F0"/>
<g opacity="0.34">
<rect x="15" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="12" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="15" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="26.4" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="15" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="40.8" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="15" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="55.2" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="15" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="69.6" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="15" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="27.8333" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="40.6667" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="53.5" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="66.3333" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="79.1667" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="92" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="104.833" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="117.667" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="130.5" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="143.333" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="156.167" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="169" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="181.833" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="194.667" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="207.5" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="220.333" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="233.167" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
<rect x="246" y="84" width="3" height="3" rx="1.5" fill="#D9D9D9"/>
</g>
<g filter="url(#filter1_d_106_361)">
<rect x="24" y="18" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter2_d_106_361)">
<rect x="50" y="16" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter3_d_106_361)">
<rect x="75" y="14" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter4_d_106_361)">
<rect x="99" y="17" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter5_d_106_361)">
<rect x="125" y="15" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter6_d_106_361)">
<rect x="151" y="16" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter7_d_106_361)">
<rect x="174" y="16" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter8_d_106_361)">
<rect x="199" y="16" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter9_d_106_361)">
<rect x="225" y="18" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter10_d_106_361)">
<rect x="199" y="38" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter11_d_106_361)">
<rect x="223" y="44" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter12_d_106_361)">
<rect x="214" y="66" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter13_d_106_361)">
<rect x="150" y="40" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter14_d_106_361)">
<rect x="150" y="65" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter15_d_106_361)">
<rect x="125" y="40" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter16_d_106_361)">
<rect x="125" y="65" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter17_d_106_361)">
<rect x="174" y="40" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter18_d_106_361)">
<rect x="188" y="62" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter19_d_106_361)">
<rect x="98" y="40" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter20_d_106_361)">
<rect x="98" y="64" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter21_d_106_361)">
<rect x="74" y="42" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter22_d_106_361)">
<rect x="50" y="42" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter23_d_106_361)">
<rect x="52" y="65" width="17" height="17" fill="#FF9B9B"/>
</g>
<g filter="url(#filter24_d_106_361)">
<rect x="23" y="42" width="17" height="17" fill="#FF9B9B"/>
</g>
</g>
</g>
<defs>
<filter id="filter0_d_106_361" x="0" y="0" width="264" height="104" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="4"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter1_d_106_361" x="22" y="17" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter2_d_106_361" x="48" y="15" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter3_d_106_361" x="73" y="13" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter4_d_106_361" x="97" y="16" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter5_d_106_361" x="123" y="14" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter6_d_106_361" x="149" y="15" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter7_d_106_361" x="172" y="15" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter8_d_106_361" x="197" y="15" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter9_d_106_361" x="223" y="17" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter10_d_106_361" x="197" y="37" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter11_d_106_361" x="221" y="43" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter12_d_106_361" x="212" y="65" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter13_d_106_361" x="148" y="39" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter14_d_106_361" x="148" y="64" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter15_d_106_361" x="123" y="39" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter16_d_106_361" x="123" y="64" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter17_d_106_361" x="172" y="39" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter18_d_106_361" x="186" y="61" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter19_d_106_361" x="96" y="39" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter20_d_106_361" x="96" y="63" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter21_d_106_361" x="72" y="41" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter22_d_106_361" x="48" y="41" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter23_d_106_361" x="50" y="64" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<filter id="filter24_d_106_361" x="21" y="41" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_106_361"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_106_361" result="shape"/>
</filter>
<clipPath id="clip0_106_361">
<rect x="8" y="6" width="248" height="88" rx="8" fill="white"/>
</clipPath>
</defs>
            </svg> */}

            <p className="labelP"> Group by </p>
              <ul className="buttonList">
                <li>
                  <input type="radio" name="group"  id="groupcolor" value="color" />
                  <label htmlFor="groupcolor">COLOR</label>
                </li>
                <li>
                  <input type="radio" name="group"  id="groupcluster" value="cluster" />
                  <label htmlFor="groupcluster">CLUSTER</label>
                </li>
              </ul>
            <div>
            <p className="labelP"> Sensitivity </p>
            </div>
            <input className="slider" type="range" min="0" max="100" 
             id="myRange" onChange={onSlide.bind(this)} ref={slideRef}></input>
            
            <button id="create" onClick={onCreate}>Apply</button>
        </div>
    );
};

export default App;
