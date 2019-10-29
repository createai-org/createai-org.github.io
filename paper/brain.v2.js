

        
class Neuron {
  constructor(options) {
    const defaults = {
	  name:undefined, 
	  nickname: undefined, 
	  alwaysOn: false, 
	  isBinaryOutput:false, 
	  isSensoryNeuron:false,
	  hideNeuron:false,
	  threshold:1, 
	  neuronIndex : undefined, 
	  disableNewConnections:false
    };
    const populated = Object.assign(defaults, options);
    for (const key in populated) {
      if (populated.hasOwnProperty(key)) {
        this[key] = populated[key];
      }
    }
    if (this["isBinaryOutput"] == true){
		this.maxFiringRate = 1;
		
	}else{
		this.maxFiringRate = undefined;
	}
    
  }
}




        
class Brain {
  constructor(options) {
    const defaults = {
	 
		stepsAhead:3, 
		neurons :[] ,
		indexOfNeuron : {},
		neuronNameOfIndex : {},
		numberOfNeurons : undefined,
		alwaysOnNeuronNames : [],
		firingFrame :undefined, 
		connectionMatrix :undefined,
		sensoryValuesDict : {} 
    };
    const populated = Object.assign(defaults, options);
    for (const key in populated) {
      if (populated.hasOwnProperty(key)) {
        this[key] = populated[key];
      }
    }
  }
  
  add_neuron( neuronObject) {
	  var currentNumOfNeurons = this.neurons.length;
      this.neuronNameOfIndex[currentNumOfNeurons] = neuronObject.name;
      this.indexOfNeuron[String(neuronObject.name)] = parseInt(currentNumOfNeurons);
      neuronObject.neuronIndex = currentNumOfNeurons;
     
		if (neuronObject.alwaysOn == true){
          this.alwaysOnNeuronNames.push(neuronObject.name);
        }
        this.neurons.push(neuronObject);
        this.numberOfNeurons = this.neurons.length;
  }
  
  init_connections() {
        var cols = this.numberOfNeurons;
        var rows = this.stepsAhead;
        
        this.firingFrame = new Array(this.stepsAhead+1);
        for (var hh=0;hh<this.stepsAhead+1;hh++){
			this.firingFrame[hh]= new Array(this.numberOfNeurons);
			for (var n=0;n<this.numberOfNeurons;n++){ 
				this.firingFrame[hh][n] = 0.0;//-9.0; 
			}
		}
        
        
        
        
        // three dimensional matrix : H+1 x N x N
        this.connectionMatrix = new Array(this.stepsAhead);
        for (var hh=0;hh<this.stepsAhead;hh++){
			this.connectionMatrix[hh]= new Array(this.numberOfNeurons); 
			for (n=0;n<this.numberOfNeurons;n++){
				this.connectionMatrix[hh][n]= new Array(this.numberOfNeurons);
			}
		}
		
		for (var hh=0;hh<this.stepsAhead;hh++){
			for (var n=0;n<this.numberOfNeurons;n++){
				for (var n2=0;n2<this.numberOfNeurons;n2++){
					this.connectionMatrix[hh][n][n2]= 0.0;
				}
			}
		}
		
		//console.log( this.connectionMatrix);
         
    }
  
  
  get_neuron_by_name(neuronName){
		
		//console.log("  index  =  "+this.indexOfNeuron[neuronName]); 
        var thisNeuron =  this.neurons[this.indexOfNeuron[String(neuronName)]];
        //console.log(thisNeuron);
        return thisNeuron;	
    }
 
 
	clear_inputs(){
		this.sensoryValuesDict = {};
	}
        
	create_connection(paramdict){
		// { fromNeuronName :"A", toNeuronName :"B", synapticStepNumber:2, connectionWeight:-1}
		var fromNeuronName = paramdict["fromNeuronName"]; 
		var toNeuronName = paramdict["toNeuronName"]; 
		var synapticStepNumber = parseInt(paramdict["synapticStepNumber"]); 
		var connectionWeight = parseFloat(paramdict["connectionWeight"]); 
		var incremental;
		
		if ('incremental' in paramdict){
			incremental = paramdict["incremental"]; 
		}else{
			incremental = true;
		}
		
        // if connectionWeight < 0,then it is inhibitory connection
        //console.log("Getting index of "+fromNeuronName);
        var n1 = this.get_neuron_by_name(fromNeuronName);
        
        //console.log("Getting index of "+toNeuronName);
        var n2 = this.get_neuron_by_name(toNeuronName);
        
		
        //console.log("Creating t+"+ (synapticStepNumber)+" connection from "+fromNeuronName+"("+ (n1.neuronIndex)+") to "+toNeuronName + "("+ (n2.neuronIndex)+") with weight "+ (connectionWeight ));
        //console.log ( "BEfore self.connectionMatrix ["+synapticStepNumber+"] ["+n1.neuronIndex+"]["+n2.neuronIndex+"] is " + this.connectionMatrix [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]); 
        if (incremental == true){  
			/*console.log("z->b = "+ this.connectionMatrix [1] [2][1]);
			console.log("a->b = "+ this.connectionMatrix [1] [0][1]);
			console.log("t+1 => "+ this.connectionMatrix [1]  );
            */
            this.connectionMatrix [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  +=   parseFloat(connectionWeight);
            /*console.log("xxx z->b = "+ this.connectionMatrix [1] [2][1]);
			console.log("xxx a->b = "+ this.connectionMatrix [1] [0][1]);
			*/
        }else{
            this.connectionMatrix [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex] =  parseFloat(connectionWeight);
        }
        
        //console.log ( "NOw self.connectionMatrix ["+synapticStepNumber+"] ["+n1.neuronIndex+"]["+n2.neuronIndex+"] is " + this.connectionMatrix [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]); 
		//console.log(this.connectionMatrix);
	}
 
 
	next_epoch(){
		
        // shift down values of firing frame by 1 
        for (var h=this.firingFrame.length-1;h>0;h--){ 
			for (var nn=0;nn<this.neurons.length;nn++){
				this.firingFrame[h][nn]= this.firingFrame[h-1][nn];
			}
        }       
        
      
         
        // reset                
        for (var neuronNumber=0;neuronNumber<this.neurons.length;neuronNumber++){
			this.firingFrame[0][neuronNumber] = 0;
		}
		
		
		//console.log(this.firingFrame);
		// fill current input at t=0.
		for(var neuronName in this.sensoryValuesDict) {
			var scalarValue = this.sensoryValuesDict[neuronName]; //  {"X_A":vv, "Y_A":vv}  
			//console.log("Setting value of "+neuronName+" to "+scalarValue);
			var neuronIndex = parseInt(this.indexOfNeuron[neuronName]); 
			this.firingFrame[0][neuronIndex] = scalarValue; 
		}	
		 
        
        // activate always on neurons
        for (var a=0;a<this.alwaysOnNeuronNames.length;a++){
			var alwaysOnNeuronName = this.alwaysOnNeuronNames[a];
            this.firingFrame[0][this.indexOfNeuron[alwaysOnNeuronName]] = this.get_neuron_by_name(alwaysOnNeuronName).maxFiringRate;
        }
        
        // send signal between neurons   
        var i1,i2,ln1,ln2; 
					
        for (i1=0;i1<this.neurons.length;i1++){
			ln1 = this.neurons[i1];
			for (i2=0;i2<this.neurons.length;i2++){
				ln2 = this.neurons[i2];
				for(var h=1;h<this.connectionMatrix.length;h++){
					// If connection between ln1 and ln2 exists,send signal to the ln2-neuron
					/*
					
					*/
					
                    var thisConnectionWeight = this.connectionMatrix[h][ln1.neuronIndex][ln2.neuronIndex];
                   
                    if (thisConnectionWeight != 0){
						this.firingFrame[0][ln2.neuronIndex]  +=   parseFloat( this.firingFrame[h][ln1.neuronIndex] * thisConnectionWeight);
						//console.log("Setting value of "+ln2.name+" @ t=0 to "+ this.firingFrame[0][ln2.neuronIndex]);
                    }
                }
            }
        }
        
        
        for (i2=0;i2<this.neurons.length;i2++){
			ln2 = this.neurons[i2];        
          
            if (ln2.maxFiringRate!= undefined){
                // eg: binary neurons have max firingrate of 1
                // if maxFiringRate is set for fromneuron, then fire at the max. firing rate when threshold is crossed.;  
                if (this.firingFrame[0][ln2.neuronIndex] >= ln2.threshold ){
                    this.firingFrame[0][ln2.neuronIndex] = ln2.maxFiringRate;
                }else{
                    this.firingFrame[0][ln2.neuronIndex] = 0;
                }         
            }        
            if (ln2.maxFiringRate == undefined){
                // if firing rate < threshold , do not fire.
                if (this.firingFrame[0][ln2.neuronIndex] < ln2.threshold ){
                  this.firingFrame[0][ln2.neuronIndex] = 0;
                }
            }      
                  
        // reset inputs
        this.clear_inputs()
		}
    
	}
}




function drawGraph( brainObject, cytoscapeObject){
	
	var neurons = [];
	var edges = [];
	
	for(var n=0;n<brainObject.neurons.length;n++){
			 
			 neurons.push({	name:brainObject.neurons[n].name,
							threshold: brainObject.neurons[n].threshold,
							isBinary:brainObject.neurons[n].isBinaryOutput,
							alwaysOn:brainObject.neurons[n].alwaysOn
							});
	}			
	
	for (var hh=1;hh<brainObject.connectionMatrix.length;hh++){ 
		for(var n=0;n<brainObject.neurons.length;n++){ 
			for(var n2=0;n2<brainObject.neurons.length;n2++){  
				if (brainObject.connectionMatrix[hh][n][n2] != 0){
					edges.push({source: brainObject.neurons[n].name,target: brainObject.neurons[n2].name,connectionWeight:brainObject.connectionMatrix[hh][n][n2],timestep:hh});
				} 
			}
		}
		
	}
		 
	//draw neurons
	
	
	
	//draw invisible neurons  to signify input from environment
	for (var i = 0; i < neurons.length; i++) {
	 
		if( brainObject.neurons[i].isSensoryNeuron  == true || brainObject.neurons[i].hideNeuron  == true){ 
			 var thisnode = cytoscapeObject.add({
				data: { id: neurons[i]["name"]+"_ENV" }
				}
			);
			thisnode.style({"visibility":'hidden', 'border-color':'black','border-width':0}); 
			 
		} 
	}

	for (var i = 0; i < neurons.length; i++) {
		var thisnode = cytoscapeObject.add({
			data: { id: neurons[i]["name"] }
			}
		);
		thisnode.style({"label":neurons[i]["name"]}); 
	} 
	
	
	
	//add tooltips for each neuron
	for (var i = 0; i < neurons.length; i++) {
		var tooltip =  'threshold θ ='+brainObject.neurons[i].threshold ;
		if( brainObject.neurons[i].isBinaryOutput  == true){ 
			tooltip = tooltip +"<br> max.output=1";
		}else{
			cytoscapeObject.getElementById(neurons[i]["name"]).style("shape","square");
			
		}
//		 makeTippy(cytoscapeObject.getElementById(neurons[i]["name"]),tooltip ).show();
	} 



	



	for (var i = 0; i < edges.length; i++) {
		var thisedge  = cytoscapeObject.add({
			data: { id: edges[i]["source"]+"_"+edges[i]["target"]+"_"+edges[i]["timestep"], source : edges[i]["source"], target  : edges[i]["target"] ,connectionWeight : edges[i]["connectionWeight"], timestep : edges[i]["timestep"] }
			}
		);
		thisedge.style({"source-text-offset":24 ,'font-family':'Lucida Console,Courier New,Courier','text-valign':'top',
						"source-label": " t+"+edges[i]["timestep"]+" ", "label": 'w = '+edges[i]["connectionWeight"],
						'font-size':8,'font-style':'normal','text-background-color':'white','text-background-opacity':0.9});
	
		//makeTippy(cytoscapeObject.getElementById(edges[i]["source"]+"_"+edges[i]["target"]+"_"+edges[i]["timestep"]), "epoch  sending "  , 'bottom').show();
		
	} 
	cytoscapeObject.nodes().style({'text-valign': 'center','background-color':'#ccc', 'border-color':'black', 'border-width':1 });
	cytoscapeObject.edges().style({'line-color':'#333', 
						'border-color':'black', 'border-width':2 ,
					'curve-style': 'bezier',
					'width': 1,  
					'target-arrow-shape': 'triangle', 
					 'target-arrow-color': '#333',   
					'arrow-scale':1.5});
	 
	cytoscapeObject.edges('[connectionWeight < 0]').style({'line-color': 'red', 'target-arrow-shape': 'triangle-cross', 'line-style':'dotted','target-arrow-color': 'red' });
	
	
	//draw invisible  edges from invisible neurons to sensory neurons, to signify input from environment
	for (var i = 0; i < neurons.length; i++) {
	 
		if( brainObject.neurons[i].isSensoryNeuron  == true){ 
			  
			var thisedge  = cytoscapeObject.add({
								data: { id: neurons[i]["name"]+"_ENVINPUT", 
										source : neurons[i]["name"]+"_ENV", 
										target  : neurons[i]["name"]  
										 }
								}
							);
			thisedge.style({"source-text-offset":24 ,'font-family':'Lucida Console,Courier New,Courier','text-valign':'top',
							"source-label": "", "label": '','line-color':'blue',
							'font-size':8,'font-style':'normal','text-background-color':'white','text-background-opacity':0.9,
							'line-color':'blue', 
							'border-color':'black', 'border-width':2 ,
							'curve-style': 'bezier',
							'width': 1,  'line-style':'dashed',
							'target-arrow-shape': 'vee', 
							 'target-arrow-color': 'blue',   
							'arrow-scale':1.5
							});
		} 
	}
	
	
	
	//mark Z as always on
	//makeTippy(cytoscapeObject.getElementById("Z"), "always On" ).show();
	 

	cytoscapeObject.layout({
		name: 'breadthfirst'
	}).run();  
}

function highlight_neuron(cytoscapeObject,neuronName){
	cytoscapeObject.nodes('[id = "'+neuronName+'"]').style({'background-color': 'yellow'});
}

function unhighlight_neuron(cytoscapeObject,neuronName){
	cytoscapeObject.nodes('[id = "'+neuronName+'"]').style({'background-color': '#ccc'});
}


 

function drawFiringFrame(brainObject, chartObject,cytoscapeObject){
	
	var newSeries = [];
	
	for (var hh=brainObject.stepsAhead;hh>=0;hh--){
		var rowName = "t=0";
		if (hh>0){ 
			rowName = "t-"+hh;
		}
		/*if(epochCount-hh >= 0){
			rowName = rowName + " Epoch"+String(epochCount-hh)
		}
		*/
		var newData = [];
		for(var n=0;n<brainObject.neurons.length;n++){
			newData.push( { x : brainObject.neurons[n].name, y : brainObject.firingFrame[hh][n] });
			if ( brainObject.firingFrame[hh][n] > 0){
				highlight_neuron(cytoscapeObject, brainObject.neurons[n].name);
			}else{
				unhighlight_neuron(cytoscapeObject, brainObject.neurons[n].name);
			}
		}
		
		newSeries.push({  	name: rowName,
							data:  newData
					 });
	 
	}					 
	 chartObject.updateSeries(newSeries);
}




function getChartOptions(){

	chartoptions = {
		  chart: { 
			type: 'heatmap', 
			foreColor: 'black',
			animations: {    enabled: false } ,
			 toolbar: {
			  show: false
			}
		  },
		  legend: {
			show: false,
			},
		  tooltip: {
			  enabled: false,
		  },
		  //  colors: [ "#cccccc"], 
		    
		  plotOptions: {
			heatmap: {
			  shadeIntensity: 0.8,
				
			  colorScale: {
				ranges: [{
					from: -30,
					to: 0,
					name: 'low',
					color: '#000000'
				  },
				  {
					from: 0,
					to: 1,
					name: 'medium',
					color: '#111111'
				  },
				  {
					from: 1,
					to: 2, 
					color: '#cccccc'
				  },
				  {
					from: 2,
					to: 999, 
					color: '#FF0000'
				  },
				  {
					from: 999,
					to: 1999, 
					color: '#FF00FF'
				  }
				]
			  }
			}
		  }, 
		   
		  dataLabels: {
			enabled: true,
			style: { 
				colors: ['#555555']
			},
		  },
		   yaxis: {
                title: {
                    text: 'Time'
                }
            },
           
            xaxis: {
                title: {
                    text: 'Neuron firing status'
                }
            },
		  
		  
		  series: [ 
			{
			  name: '',
			  data:  [
						{ x: "Click button to start sending inputs ....", y: 0 } 
					]
			} 
			 
		  ],
		  title: {
			text: 'Firing frame',
			align:'center',
			style :{ 
				color : 'black',
				fontFamily:'Ubuntu,Verdana'
				}
		  },

	};

	return chartoptions;
	


}



