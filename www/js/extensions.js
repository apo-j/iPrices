/**
 * Created by chenglian on 15/4/18.
 */
//add new items to the tail
Array.prototype.pushRange = function(arr) {
    this.push.apply(this, arr);
};

//add new items to the head
Array.prototype.unshiftRange = function(arr) {
    this.unshift.apply(this, arr);
};
