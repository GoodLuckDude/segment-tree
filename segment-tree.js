//Рекурсивное дерево через создание одномерных деревьев и комбинация их через dummy?

function dummySegmentTree(array, fn, N) {
  if (Array.isArray(array[0])) {
  return function(from, to){
    let result = N;
    for (let i = from; i < to; i++) {
      result = fn(array[i], result);
    }
    return result;
    }
  }
}

function segmentTree(array, fn, N) {

  function buildTree(array, fn) {
  var tree = [];
  function build (pos, tl, tr) {
    if (tr < 0) {return}
    if (tl == tr) {
      tree[pos] = array[tl];
    } else {
      var tm = Math.floor((tl + tr) / 2);
      build(pos*2+1, tl, tm);
      build(pos*2+2, tm+1, tr);
      tree[pos] = fn(tree[pos*2+1], tree[pos*2+2])
    }
  };
  build(0, 0, array.length-1);
  return tree;
  }

  var tree = buildTree(array,fn, N);

  function newTree(tree){
    function fromTo(from, to){
      if (from == to) {return N}
      if (from < 0 || to > array.length || to < from) {throw new Error("This range is not valid")}
      function count (pos, tl, tr){
        if (tr < from || tl > to-1) {return N}
        if (tl >= from && tr < to) {return tree[pos]}
        var tm = Math.floor((tl + tr) / 2);
        return fn(count(pos*2+1, tl, tm), count(pos*2+2, tm+1, tr));
      };
      var result = count(0, 0, array.length-1);
      return result
    }
    return fromTo
  }

  return newTree(tree)
};


function recursiveSegmentTree(array, fn, N) {         //Spaghetti code
  function makeArrayOfTrees (array, fn, N) {
    let arrayOfTrees = array.map(value => {
      if(Array.isArray(value[0])) {
        return makeArrayOfTrees(value, fn, N)
      } else {
        return segmentTree(value, fn, N)
      }
    })
    return arrayOfTrees;
  }

  if (Array.isArray(array[0])) {
    let arrayOfTrees = makeArrayOfTrees(array, fn, N);

    if(!Array.isArray(array[0][0])) {   //if need to two-dimensional tree

      return function(from, to) {
        let cutedTrees = arrayOfTrees.filter((elf, indx) => {
          return (indx >= from && indx < to);
        })
        
        return function(from, to) {
          let result = N;
          cutedTrees.forEach(foo => {
            result = fn(result, foo(from, to));
          })
          return result;
        }
      }
    } else {                            //if need to three-dimensional tree
      return function(from, to) {
        let cutedTrees = arrayOfTrees.filter((elf, indx) => {
          return (indx >= from && indx < to);
        })

        return function(from, to) {
          let resultedTrees = [];

          cutedTrees.forEach((elf, indxOfElf) => {
            cutedTrees[indxOfElf] = elf.filter((gem, indx) => {
              return (indx >= from && indx < to);
            })
          })

          resultedTrees = resultedTrees.concat(cutedTrees);

          return function(from, to) {
            let result = N;
            resultedTrees.forEach((arrayOfTrees) => {
              arrayOfTrees.forEach(tree => {
                result = fn(result, tree(from, to));
              })
            })
            return result;
          }
        }
      }
    }
  } else {
    return segmentTree(array, fn, N);
  }
}

function getElfTree(array) {
  return recursiveSegmentTree(array, sum, 0);
}

function addAssignmentPosition(assignment, elf, gem, amount) {
  if(!assignment[elf]) { assignment[elf] = {} };
  if(!assignment[elf][gem]) { assignment[elf][gem] = 0 }
  assignment[elf][gem] += amount;
}

function assignEqually(tree, wishes, stash, elves, gems, week) {
  var assignment = {};
  var gemsOfStash = Object.keys(stash);
  let quantitiesOfGems = [];              //current amount of elves's gems

  elves.forEach((elf, indxOfElf) => {     //fill 'quantitiesOfGems'
    quantitiesOfGems.push( tree(indxOfElf, indxOfElf + 1)(0, gems.length)(0, week) );
  })

  gemsOfStash.forEach((gem) => {          //fill assignment
    for(let i = 0; i < stash[gem]; i++) {
      let elfLoser;
      let currentMinAmount = +Infinity;

      quantitiesOfGems.forEach((gemsOfElf, indxOfElf) => {  //find elfLoser
        if (gemsOfElf < currentMinAmount) {
          currentMinAmount = gemsOfElf;
          elfLoser = elves[indxOfElf];
        }
      })
      
      quantitiesOfGems[elves.indexOf(elfLoser)]++;  //add 1 gem to 'elfLoser'
      addAssignmentPosition(assignment, elfLoser, gem, 1);  //note this in assignment
    }
  })

  return assignment
}


function assignAtLeastOne(tree, wishes, stash, elves, gems, week) {
  var assignment = {};
  var gemsOfStash = Object.keys(stash);
  var indxOfElf = 0;

  gemsOfStash.forEach((gem) => {
    for (let i = 0; i < stash[gem]; i++, indxOfElf++) {
      addAssignmentPosition(assignment, elves[indxOfElf], gem, 1)
      if(indxOfElf == elves.length-1) {indxOfElf = 0}
    }
  })

  return assignment;
}

function assignPreferredGems(tree, wishes, stash, elves, gems) {
  var assignment = {};
  var gemsOfStash = Object.keys(stash);

  gemsOfStash.forEach((gem) => {
    let elf;
    let maxWish = -Infinity;
    let indxOfGem = gems.indexOf(gem);
    
    wishes.forEach((wish, indxOfElf) => {
      if (wish[indxOfGem] < maxWish) {return}
      maxWish = wish[indxOfGem];
      elf = elves[indxOfElf];
    })

    addAssignmentPosition(assignment, elf, gem, stash[gem]);
  })

  return assignment;
}

function nextState(state, assignment, elves, gems) {
  var keysAssig = Object.keys(assignment);
  var elf;
  var gem;
  var amount;

  function addNewParam(key) {
    elf = elves.indexOf(key);
    var keysOfGems = Object.keys(assignment[key]);
    for (let i = 0; i < keysOfGems.length; i++) {
      gem = gems.indexOf(keysOfGems[i]);
      amount = assignment[key][keysOfGems[i]];
      state[elf][gem].pop();
      state[elf][gem].push(amount);
    }
  }

  state.forEach(function(elf){      //add 0 to state
    elf.forEach(function(gem) {
      gem[gem.length] = 0;
    })
  });

  for (let i = 0; i < keysAssig.length; i++) {
    addNewParam(keysAssig[i]);
  }
  
  return state;
}
