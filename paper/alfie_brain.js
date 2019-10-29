

        
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
		drawFiringFrame:true,
		epochCount:0, 
		neurons :[] ,
		satiationNeuronIndex:{},
		painNeuronIndex:{},
		indexOfNeuron : {},
		neuronNameOfIndex : {},
		numberOfNeurons : undefined,
		alwaysOnNeuronNames : [],
		firingFrame :undefined, 
		connectionMatrix :undefined, 
		fluctuatingConnectionsList: {},  // "H_n1index_n2index"  
		pathways : [],  //{from:"A_",to :"B_"} to create new connections
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
		
		var fluctuateFlag;
		if ('fluctuate' in paramdict){
			fluctuateFlag = paramdict["fluctuate"]; 
		}else{
			fluctuateFlag = false;
		}
		
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
        
        if (fluctuateFlag == true){
			//mark connection as fluctuating signal strength,ie, a random value is added to the signal strength if it passes through this connection;
			this.fluctuatingConnectionsList[synapticStepNumber+"_"+n1.neuronIndex+"_"+n2.neuronIndex] = true;
		}
        
        //console.log ( "NOw self.connectionMatrix ["+synapticStepNumber+"] ["+n1.neuronIndex+"]["+n2.neuronIndex+"] is " + this.connectionMatrix [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]); 
		//console.log(this.connectionMatrix);
	}
 
 
	next_epoch(){
		
		 
		this.epochCount++;
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
						
						
						//if this is a fluctuating connection, add a tiny random value.
						if (h+"_"+ln1.neuronIndex+"_"+ln2.neuronIndex  in this.fluctuatingConnectionsList){
							this.firingFrame[0][ln2.neuronIndex]  += parseFloat(Math.random());
						}
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


 
  


function get_scalar_circuit_neurons(prefixString, rangeBuckets,maxValue){
	
	var neuronObjects = [];
	
	var A1 = new Neuron({name:  prefixString+"A1",threshold:1,	isBinaryOutput :false,isSensoryNeuron:true});
	var B1 = new Neuron({name:  prefixString+"B1",threshold:1,	isBinaryOutput :false});
	neuronObjects.push(A1);
	neuronObjects.push(B1);
	
	for(var r=1;r<=rangeBuckets;r++){
		var Cx =  new Neuron({name:  prefixString+"C"+r,threshold:1+(r-1)*(maxValue/rangeBuckets),	isBinaryOutput :true});  
		neuronObjects.push(Cx); 
	}

	for(var r=1;r<=rangeBuckets;r++){
		var Dx =  new Neuron({name:  prefixString+"D"+r,threshold:1 ,	isBinaryOutput :true});  
		neuronObjects.push(Dx); 
	}
	    
	var E = new Neuron({name:  prefixString+"E",threshold:1,	isBinaryOutput :false}); 
	
	//for Inverse Neuron generation
	var Z = new Neuron({name:  prefixString+"Z",threshold:1,	isBinaryOutput :true,alwaysOn:true});
	var F = new Neuron({name:  prefixString+"F",threshold:1,	isBinaryOutput :false}); 
	
	neuronObjects.push(E); 
	neuronObjects.push(Z); 
	neuronObjects.push(F); 
	
	//console.log(neuronObjects);
	return neuronObjects;
}


function get_scalar_circuit_connections(prefixString, rangeBuckets,maxValue){
	var connectionObjects = [];
	
	connectionObjects.push({ fromNeuronName : prefixString+"A1", toNeuronName : prefixString+"B1", synapticStepNumber:1, connectionWeight:1.0});  
	
	for(var r=1;r<=rangeBuckets;r++){
		connectionObjects.push({ fromNeuronName : prefixString+"B1", toNeuronName : prefixString+"C"+r, synapticStepNumber:1, connectionWeight:1.0}); 
	}
	
	for(var r=1;r<=rangeBuckets;r++){   
		connectionObjects.push({ fromNeuronName : prefixString+"C"+r, toNeuronName : prefixString+"D"+r, synapticStepNumber:1, connectionWeight:1.0});  
	} 
	
	for(var r=2;r<=rangeBuckets;r++){    
		connectionObjects.push({ fromNeuronName : prefixString+"C"+r, toNeuronName : prefixString+"D"+(r-1), synapticStepNumber:1, connectionWeight:-1.0});   
	}
	
	for(var r=1;r<=rangeBuckets;r++){
		connectionObjects.push({ fromNeuronName : prefixString+"D"+r, toNeuronName : prefixString+"E", synapticStepNumber:1, connectionWeight:1.0}); 
	}
	  
	connectionObjects.push({ fromNeuronName : prefixString+"Z",  toNeuronName : prefixString+"F", synapticStepNumber:1, connectionWeight:1.0});
	for(var r=1;r<=rangeBuckets;r++){
		connectionObjects.push({ fromNeuronName : prefixString+"D"+r, toNeuronName : prefixString+"F", synapticStepNumber:1, connectionWeight:-1.0});  
	}
	
	
	//console.log(connectionObjects);
	return connectionObjects;
}

