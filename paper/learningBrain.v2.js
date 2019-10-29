

        
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
	  disableNewConnections:false,
	  isPainNeuron: false,
	  isSatiationNeuron:false
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
		stepsAheadForDynamicConnections:1,
		neurons :[] ,
		satiationNeuronIndex:{},
		painNeuronIndex:{},
		indexOfNeuron : {},
		neuronNameOfIndex : {},
		numberOfNeurons : undefined,
		alwaysOnNeuronNames : [],
		firingFrame :undefined, 
		connectionMatrix :undefined,
		connectionMatrixDynamic :undefined,
		fluctuatingConnectionsList: {},  // "H_n1index_n2index"
		weightOfNewDynamicConnection: 0.8,
		strengtheningFactorOfExistingDynamicConnection : 0.2	,
		weakeningFactorOfExistingDynamicConnection : -0.1,
		//weakenFrequencyInEpochs:5,
		maxStrengthOfDynamicConnections:3,
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
      if(neuronObject.isSatiationNeuron == true){
		this.satiationNeuronIndex[neuronObject.neuronIndex] = true;
	  } 
	  
	  if(neuronObject.isPainNeuron == true){
		this.painNeuronIndex[neuronObject.neuronIndex] = true;
	  }
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
        this.connectionMatrixDynamic = new Array(this.stepsAhead);
        for (var hh=0;hh<this.stepsAhead;hh++){
			this.connectionMatrix[hh]= new Array(this.numberOfNeurons); 
			this.connectionMatrixDynamic[hh]= new Array(this.numberOfNeurons); 
			
			for (n=0;n<this.numberOfNeurons;n++){
				this.connectionMatrix[hh][n]= new Array(this.numberOfNeurons);
				this.connectionMatrixDynamic[hh][n]= new Array(this.numberOfNeurons);
			}
		}
		
		for (var hh=0;hh<this.stepsAhead;hh++){
			for (var n=0;n<this.numberOfNeurons;n++){
				for (var n2=0;n2<this.numberOfNeurons;n2++){
					this.connectionMatrix[hh][n][n2]= 0.0;
					this.connectionMatrixDynamic[hh][n][n2]= 0.0;
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
	
	
	
	
	///operant conditining : positive reinforcement
	strengthen_decisions_based_on_firingFrame(){
		
		//check if any satiation neurons have fired.
		// if so, from among  neurons that fired within t-H steps,  find the neurons which have fluctuating outgoing connections and strengthen those outgoing connections.  
		// find the neurons which have fluctuating outgoing connections and strengthen those connections.  
		
		var neuronsWithIncomingFluctuatingConnections = [];
		var fluctuatingConnArr = Object.keys(this.fluctuatingConnectionsList); //eg:  H_n1Index_n2Index 
		for(var n=0;n<this.neurons.length;n++){
			if( this.firingFrame[0][n ] > 0 &&  n in this.satiationNeuronIndex){
				console.log("satiation neuron "+this.neuronNameOfIndex[n]+" fired");  
				var neuronsThatFiredRecently = [];
				//for(var hh=this.stepsAheadForDynamicConnections;hh>=1;hh--){
				for(var hh=1;hh>=1;hh--){
					for(var ff=0;ff<this.neurons.length;ff++){
						if (this.firingFrame[hh][ff] > 0){
							console.log("Will strengthen incoming connections of "+this.neuronNameOfIndex[ff]);
							this.strengthen_incoming_connections_to_neuron(ff,this.stepsAheadForDynamicConnections, undefined);
							 
						}
					}
				}
				    
			}
			
			if( this.firingFrame[0][n ] > 0 &&  n in this.painNeuronIndex){
				console.log("pain neuron "+this.neuronNameOfIndex[n]+" fired");  
				 
				var neuronsThatFiredRecently = [];
				//for(var hh=this.stepsAheadForDynamicConnections;hh>=1;hh--){
				for(var hh=1;hh>=1;hh--){
					for(var ff=0;ff<this.neurons.length;ff++){
						if (this.firingFrame[hh][ff] > 0){
							console.log("Will weaken incoming connections of "+this.neuronNameOfIndex[ff]);
							this.weaken_incoming_connections_to_neuron(ff,this.stepsAheadForDynamicConnections, undefined);
							 
						}
					}
				}
				    
			}
				
		} 
		 
	}
	
	strengthen_incoming_connections_to_neuron(neuronIndex,depth,initval){
		var depthValue = depth;
		if(initval == undefined){
			initval=0;
		}
		//if the source neuron of a connection was active at t-H, then strengthen/create dynamic connection between sourceNeuron and this neuronIndex
		// do this recursively for sourceNeuron, (upto depth)
		for (var hh=1;hh<=this.stepsAheadForDynamicConnections;hh++){   
			for(var n1=0;n1<this.neurons.length;n1++){
				//console.log(">>>>"+this.neuronNameOfIndex[n1]+"@"+(hh+1+initval)+" = "+this.firingFrame[hh+1+initval][n1] ); 
				if(this.connectionMatrix [hh] [n1][neuronIndex] > 0  && this.firingFrame[hh+1+initval][n1] > 0){
					//
					 //console.log(this.neuronNameOfIndex[n1]+"@"+(hh+1+initval)+" = "+this.firingFrame[hh+1+initval][n1] ); 
					 
					//if a fluctuating connection is reached, break;
					//H_n1Index_n2Index
					if(hh+"_"+n1+"_"+neuronIndex in this.fluctuatingConnectionsList ){
						//console.log("outgoing conn of "+this.neuronNameOfIndex[n1]+" to "+this.neuronNameOfIndex[neuronIndex]+" is fluctuating");
						return;
						
					}
					
					this.create_dynamic_connection({ fromNeuronName :this.neuronNameOfIndex[n1], toNeuronName :this.neuronNameOfIndex[neuronIndex], synapticStepNumber:hh, connectionWeight: this.weightOfNewDynamicConnection});
					
					
					if( depthValue>0){
						this.strengthen_incoming_connections_to_neuron(n1,depthValue-1,initval+1);
					}
					
					
				}
			}
		} 
		
	}
	
	
	weaken_incoming_connections_to_neuron(neuronIndex,depth,initval){
		var depthValue = depth;
		if(initval == undefined){
			initval=0;
		}
		// if the source neuron of a connection was active at t-H, then strengthen/create dynamic connection between sourceNeuron and this neuronIndex
		// do this recursively for sourceNeuron, (upto depth)
		for (var hh=1;hh<=this.stepsAheadForDynamicConnections;hh++){   
			for(var n1=0;n1<this.neurons.length;n1++){
				//console.log(">>>>"+this.neuronNameOfIndex[n1]+"@"+(hh+1+initval)+" = "+this.firingFrame[hh+1+initval][n1] ); 
				if(this.connectionMatrix [hh] [n1][neuronIndex] > 0  && this.firingFrame[hh+1+initval][n1] > 0){
					//
					 //console.log(this.neuronNameOfIndex[n1]+"@"+(hh+1+initval)+" = "+this.firingFrame[hh+1+initval][n1] ); 
					 
					//if a fluctuating connection is reached, break;
					//H_n1Index_n2Index
					if(hh+"_"+n1+"_"+neuronIndex in this.fluctuatingConnectionsList ){
						//console.log("outgoing conn of "+this.neuronNameOfIndex[n1]+" to "+this.neuronNameOfIndex[neuronIndex]+" is a fluctuating connection");
						return; 
					}
					
					this.create_dynamic_connection({ fromNeuronName :this.neuronNameOfIndex[n1], toNeuronName :this.neuronNameOfIndex[neuronIndex], synapticStepNumber:hh, connectionWeight: this.weakeningFactorOfExistingDynamicConnection});
					
					
					if( depthValue>0){
						this.weaken_incoming_connections_to_neuron(n1,depthValue-1,initval+1);
					}
					
					
				}
			}
		} 
		
	}
	
	
	
	create_dynamic_connections_from_firingFrame(){
		for(var i=0;i<this.pathways.length;i++){
			var fromRegionPrefix= this.pathways[i]["from"];
			var toRegionPrefix= this.pathways[i]["to"];
			//console.log("Pathway : Will create connections from "+fromRegionPrefix+"* to "+toRegionPrefix+"*");
			var fromNeurons = [];
			var toNeurons = []; 
			
			for(var nnn=0;nnn<this.neurons.length;nnn++){
				if (this.neurons[nnn].name.startsWith(fromRegionPrefix)){
					fromNeurons.push(this.neurons[nnn].name);
				}
				if (this.neurons[nnn].name.startsWith(toRegionPrefix)){
					toNeurons.push(this.neurons[nnn].name);
				} 
			}
			
			for(var ff=0;ff<fromNeurons.length;ff++){	 
				var thisFromNeuron = fromNeurons[ff];
				var thisFromNeuronIndex = this.indexOfNeuron[thisFromNeuron];
				for(var tt=0;tt<toNeurons.length;tt++){	 
					var thisToNeuron = toNeurons[tt];
					var thisToNeuronIndex = this.indexOfNeuron[thisToNeuron];
					
					for(var hh=this.stepsAhead;hh>=1;hh--){
						for(var st=1;st<=this.stepsAheadForDynamicConnections;st++){
							if ( hh -st <=0){
								continue;
							}
							if (this.firingFrame[hh][thisFromNeuronIndex] > 0 && this.firingFrame[hh-st][thisToNeuronIndex] > 0){
								
								  if (this.connectionMatrixDynamic [st] [thisFromNeuronIndex][thisToNeuronIndex]  > 0){
									 console.log(this.epochCount+"_____Will strengthen t+"+st+" connection from "+thisFromNeuron+" to "+thisToNeuron);
								 }else{
									 console.log(this.epochCount+"_____Will create t+"+st+" connection from "+thisFromNeuron+" to "+thisToNeuron);
								 }
								/* console.log(this.firingFrame[0]);
								 console.log(this.firingFrame[1]);
								  console.log(this.firingFrame[2]); 
								  */
								this.create_dynamic_connection({ fromNeuronName :thisFromNeuron, toNeuronName :thisToNeuron, synapticStepNumber:st, connectionWeight: -1*this.weightOfNewDynamicConnection}); 
			
							}
						}
					}
				}
			}
			
			//brainObject.create_dynamic_connection({ fromNeuronName :"B", toNeuronName :"C", synapticStepNumber:1, connectionWeight:1.0}); 
			
		}
	}
	
	create_dynamic_connection(paramdict){
		// { fromNeuronName :"A", toNeuronName :"B", synapticStepNumber:2, connectionWeight:-1}
		var fromNeuronName = paramdict["fromNeuronName"]; 
		var toNeuronName = paramdict["toNeuronName"]; 
		var synapticStepNumber = parseInt(paramdict["synapticStepNumber"]); 
		var connectionWeight = parseFloat(paramdict["connectionWeight"]); 
		 
       
        var n1 = this.get_neuron_by_name(fromNeuronName); 
        var n2 = this.get_neuron_by_name(toNeuronName);
        
		
        //console.log("Creating t+"+ (synapticStepNumber)+" connection from "+fromNeuronName+"("+ (n1.neuronIndex)+") to "+toNeuronName + "("+ (n2.neuronIndex)+") with weight "+ (connectionWeight ));
        //console.log ( "BEfore self.connectionMatrixDynamic ["+synapticStepNumber+"] ["+n1.neuronIndex+"]["+n2.neuronIndex+"] is " + this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]); 
       
        
        
		if (this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  > 0){	
			//if dynamic connection already exists, then
			//strengthen incoming dynamic connnection  only if atleast one of the incoming signals is not from a dynamic connection.  
			 var doStrengthenFlag = false;
			 var doWeakenFlag = false;
			 var xn2=this.indexOfNeuron[toNeuronName];
			 
			 for(var hh=this.stepsAhead;hh>=0;hh--){
				for(var st=1;st<=this.stepsAheadForDynamicConnections;st++){
					if ( hh -st <=0){
						continue;
					}
					 
					for (var xn1=0;xn1<this.numberOfNeurons;xn1++){ 
						// if target neuron is active, and 
						// if incoming hardwiredconnx weight at hh > 0 and
						// if that incoming hardwiredconnx source neuron was   active at (t-hh)
						// only then doStrengthen 
						//console.log("Checking for hardwired t+"+(hh-st)+" connection between "+ this.neuronNameOfIndex[xn1] +" and "+ this.neuronNameOfIndex[xn2]  );
						
						if ( connectionWeight > 0 && this.firingFrame[hh][xn1] > 0 && this.connectionMatrix[hh-st][xn1][xn2]>0 && this.firingFrame[hh-st][xn2] > 0){
							console.log("Exists: hardwired "+(hh-st)+" connection between "+ this.neuronNameOfIndex[xn1] +" and "+ this.neuronNameOfIndex[xn2]  );
							doStrengthenFlag = true;
							console.log("WILL STREGTHEN dynamic conn between "+fromNeuronName +" and "+toNeuronName);
							break;
						}  
						
						if(connectionWeight < 0){
							
							doWeakenFlag = true;
							console.log("WILL WEAKEN dynamic conn between "+fromNeuronName +" and "+toNeuronName);
							break;
						}
					 
					}
				}
			}
			
			if (doStrengthenFlag == true){
				
				console.log(">>Strengthening t+"+synapticStepNumber+" connection from "+fromNeuronName+" to "+toNeuronName); 
				this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  += this.strengtheningFactorOfExistingDynamicConnection;
				/*console.log("xxx z->b = "+ this.connectionMatrixDynamic [1] [2][1]);
				console.log("xxx a->b = "+ this.connectionMatrixDynamic [1] [0][1]);
				*/
				
				if ( this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex] > this.maxStrengthOfDynamicConnections){
					this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  = this.maxStrengthOfDynamicConnections;
				}
			}
			
			if(doWeakenFlag == true){
				console.log(">>Weakening t+"+synapticStepNumber+" connection from "+fromNeuronName+" to "+toNeuronName); 
				this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  -= this.weakeningFactorOfExistingDynamicConnection;
				if(this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex] < 0){
					this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]  = 0;
				}
			}
			
        }else{
			//create new ( t+synapticStepNumber ) connection.
			console.log(">>Creating new  t+"+synapticStepNumber+" connection from "+fromNeuronName+" to "+toNeuronName +" with weight "+connectionWeight); 
            this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex] =  parseFloat(connectionWeight);
        }
        
        //console.log ( "NOw self.connectionMatrixDynamic ["+synapticStepNumber+"] ["+n1.neuronIndex+"]["+n2.neuronIndex+"] is " + this.connectionMatrixDynamic [synapticStepNumber] [n1.neuronIndex][n2.neuronIndex]); 
		//console.log(this.connectionMatrixDynamic);
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
		
		
		//this.create_dynamic_connections_from_firingFrame(); 
		
		this.strengthen_decisions_based_on_firingFrame();
		
		
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
        
        
        //dynamic connections
        for (i1=0;i1<this.neurons.length;i1++){
			ln1 = this.neurons[i1];
			for (i2=0;i2<this.neurons.length;i2++){
				ln2 = this.neurons[i2];
				for(var h=1;h<this.connectionMatrixDynamic.length;h++){
                    var thisConnectionWeight = this.connectionMatrixDynamic[h][ln1.neuronIndex][ln2.neuronIndex];
                   
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
			
			
			//weaken all incoming dynamic connections except those which caused the target neuron to fire.
			 
			 for (var hh=0;hh<this.stepsAhead;hh++){   
				for (var n1=0;n1<this.numberOfNeurons;n1++){ 
					for (var n2=0;n2<this.numberOfNeurons;n2++){ 
						// if target neuron is active, and 
						// if incoming dynamicconnx weight at hh > 0 and
						// if that incoming dynamicconnx sourceneuron was not active at (t-hh)
						
						/*
						if (this.firingFrame[0][n2] > 0 && this.connectionMatrixDynamic[hh][n1][n2]>0 ){
							console.log("target "+this.neuronNameOfIndex[n2]+" is active"); 
							console.log("target "+this.neuronNameOfIndex[n2]+" has incoming  dynamic connection from  "+this.neuronNameOfIndex[n1] ); 
							if(this.firingFrame[hh][n1] > 0){
								console.log("source "+this.neuronNameOfIndex[n1]+" is active"); 
							}else{
								console.log("source "+this.neuronNameOfIndex[n1]+" is inactive"); 
							
							
							}
						} */
						
						if(this.firingFrame[0][n2] > 0  && this.connectionMatrixDynamic[hh][n1][n2]>0 && this.firingFrame[hh][n1] == 0 ){
							
							console.log("Weakening t+"+hh+" connection from "+n1+" to "+n2);
							
							this.connectionMatrixDynamic[hh][n1][n2]  += parseFloat(this.weakeningFactorOfExistingDynamicConnection);
							if (this.connectionMatrixDynamic[hh][n1][n2] < 0){
								this.connectionMatrixDynamic[hh][n1][n2] = 0;
							}
						}
					}
				}
			} 
         
		}
    
	}
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
			newData.push( { x : brainObject.neurons[n].name, y : brainObject.firingFrame[hh][n].toFixed(2) });
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
	if(this.drawFiringFrame == true){ 
		chartObject.updateSeries(newSeries);
	}
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


function drawGraphCustom( brainObject, cytoscapeObject){
	
	
	cytoscapeObject.elements().remove();
	
	var neurons = [];
	var edges = [];
	var edges2 = [];
	
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
	
	
	for (var hh=1;hh<brainObject.connectionMatrixDynamic.length;hh++){ 
		for(var n=0;n<brainObject.neurons.length;n++){ 
			for(var n2=0;n2<brainObject.neurons.length;n2++){  
				if (brainObject.connectionMatrixDynamic[hh][n][n2] != 0){
					edges2.push({source: brainObject.neurons[n].name,target: brainObject.neurons[n2].name,connectionWeight:brainObject.connectionMatrixDynamic[hh][n][n2],timestep:hh});
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
			data: { id: edges[i]["source"]+"_"+edges[i]["target"]+"_"+edges[i]["timestep"], typeOfConnection: 1, source : edges[i]["source"], target  : edges[i]["target"] ,connectionWeight : edges[i]["connectionWeight"], timestep : edges[i]["timestep"] }
			}
		);
		thisedge.style({   "source-text-offset":24 ,'font-family':'Lucida Console,Courier New,Courier','text-valign':'top',
						"source-label": " t+"+edges[i]["timestep"]+" ", "label": 'w = '+edges[i]["connectionWeight"].toFixed(2),
						'font-size':12,'font-style':'normal','text-background-color':'white','text-background-opacity':0.9});
	
		//makeTippy(cytoscapeObject.getElementById(edges[i]["source"]+"_"+edges[i]["target"]+"_"+edges[i]["timestep"]), "epoch  sending "  , 'bottom').show();
		if(edges[i]["timestep"]+"_"+brainObject.indexOfNeuron[edges[i]["source"]]+"_"+brainObject.indexOfNeuron[edges[i]["target"]] in brainObject.fluctuatingConnectionsList){
			thisedge.style({  'line-style':'dashed'});
		}
		
	} 
	
	
	//dynamic connections
	for (var i = 0; i < edges2.length; i++) {
		var thisedge  = cytoscapeObject.add({
			data: { id: edges2[i]["source"]+"_"+edges2[i]["target"]+"_"+edges2[i]["timestep"]+"_dynamic", typeOfConnection: 2, source : edges2[i]["source"], target  : edges2[i]["target"] ,connectionWeight : edges2[i]["connectionWeight"], timestep : edges2[i]["timestep"] }
			}
		);
		thisedge.style({ 'line-style':'dotted', "source-text-offset":24 ,'font-family':'Lucida Console,Courier New,Courier','text-valign':'top',
						"source-label": " t+"+edges2[i]["timestep"]+" ", "label": 'w = '+edges2[i]["connectionWeight"].toFixed(2),
						'font-size':12,'font-style':'normal','text-background-color':'white','text-background-opacity':0.9});
	
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
	 
	cytoscapeObject.edges('[connectionWeight < 0]').style({'line-color': 'red', 'target-arrow-shape': 'triangle-cross', 'line-style':'solid','target-arrow-color': 'red' });
	 
	
	
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

