var KNeighborsClassifier = function(nNeighbors, nClasses, power, X, y) {

    this.nNeighbors = nNeighbors;
    this.nTemplates = y.length;
    this.nClasses = nClasses;
    this.power = power;
    this.X = X;
    this.y = y;

    var Neighbor = function(clazz, dist) {
        this.clazz = clazz;
        this.dist = dist;
    };

    var compute = function(temp, cand, q) {
        var dist = 0.,
            diff;
        for (var i = 0, l = temp.length; i < l; i++) {
    	    diff = Math.abs(temp[i] - cand[i]);
    	    if (q==1) {
    	        dist += diff;
    	    } else if (q==2) {
    	        dist += diff*diff;
    	    } else if (q==Number.POSITIVE_INFINITY) {
    	        if (diff > dist) {
    	            dist = diff;
    	        }
    	    } else {
    	        dist += Math.pow(diff, q);
    		}
        }
        if (q==1 || q==Number.POSITIVE_INFINITY) {
            return dist;
        } else if (q==2) {
            return Math.sqrt(dist);
        } else {
            return Math.pow(dist, 1. / q);
        }
    };
    
    this.predict = function(features) {
        var classIdx = 0, i;
        if (this.nNeighbors == 1) {
            var minDist = Number.POSITIVE_INFINITY,
                curDist;
            for (i = 0; i < this.nTemplates; i++) {
                curDist = compute(this.X[i], features, this.power);
                if (curDist <= minDist) {
                    minDist = curDist;
                    classIdx = this.y[i];
                }
            }
        } else {
            var classes = new Array(this.nClasses).fill(0);
            var dists = [];
            for (i = 0; i < this.nTemplates; i++) {
                dists.push(new Neighbor(this.y[i], compute(this.X[i], features, this.power)));
            }
            dists.sort(function compare(n1, n2) {
                return (n1.dist < n2.dist) ? -1 : 1;
            });
            for (i = 0; i < this.nNeighbors; i++) {
                classes[dists[i].clazz]++;
            }
            for (i = 0; i < this.nClasses; i++) {
                classIdx = classes[i] > classes[classIdx] ? i : classIdx;
            }
        }
        return classIdx;
    };

};

