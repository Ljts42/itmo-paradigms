
; hard Shapeless

(defn operation [pre post func]
  (fn [& args]
    {:pre [(apply pre args)]
     :post [(post %)]}
    (apply mapv func args)))

(defn correct-vector? [vect] (and (vector? vect) (every? number? vect)))
(defn vectors-check [& args] (and (every? correct-vector? args) (apply == (mapv count args))))

(def v+ (operation vectors-check correct-vector? +))
(def v- (operation vectors-check correct-vector? -))
(def v* (operation vectors-check correct-vector? *))
(def vd (operation vectors-check correct-vector? /))

(defn scalar [& args]
  {:pre [(apply vectors-check args)]
   :post [(number? %)]}
  (reduce + (apply v* args)))

(defn vect [& args]
  {:pre [(apply vectors-check args) (== (count (first args)) 3)]
   :post [(and (correct-vector? %) (== (count %) 3))]}
  (reduce (fn [v1 v2]
            {:post [(and (correct-vector? %) (== (count %) 3))]}
            (let [[a b c] v1, [d e f] v2]
              (vector (- (* b f) (* c e))
                      (- (* c d) (* a f))
                      (- (* a e) (* b d))))) args))

(defn v*s [vect & args]
  {:pre [(and (correct-vector? vect) (every? number? args))]
   :post [(correct-vector? %)]}
  (let [s (apply * args)] (mapv (fn [elem] (* elem s)) vect)))

(defn correct-matrix? [matrix] (and (vector? matrix) (apply vectors-check matrix)))
(defn matrices-check [& args] (and
                                (every? correct-matrix? args)
                                (apply == (mapv count args))
                                (apply == (mapv #(count (first %)) args))))

(def m+ (operation matrices-check correct-matrix? v+))
(def m- (operation matrices-check correct-matrix? v-))
(def m* (operation matrices-check correct-matrix? v*))
(def md (operation matrices-check correct-matrix? vd))

(defn m*s [matrix & args]
  {:pre [(and (correct-matrix? matrix) (every? number? args))]
   :post [(correct-matrix? %)]}
  (let [s (apply * args)]
    (mapv (fn [vect] (v*s vect s)) matrix)))

(defn m*v [matrix & args]
  {:pre [(and (correct-matrix? matrix)
              (apply vectors-check args)
              (== (count (first matrix)) (count (first args))))]
   :post [(correct-vector? %)]}
  (let [s (apply v* args)]
    (mapv (fn [vect] (apply + (v* vect s))) matrix)))

(defn transpose [matrix]
  {:pre [(correct-matrix? matrix)]
   :post [(or (and (== (count (first matrix)) 0) (= % (vector))) (correct-matrix? %))]}
  (apply mapv vector matrix))

(defn m*m [& args]
  {:pre [(every? correct-matrix? args)]
   :post [(correct-matrix? %)]}
  (reduce (fn [m1 m2]
      {:pre [(and (correct-matrix? m1)
                  (correct-matrix? m2)
                  (== (count (first m1)) (count m2)))]
       :post [(correct-matrix? %)]}
      (mapv (fn [vect] (m*v (transpose m2) vect)) m1)) args))

(defn shapeless-op [func]
  (fn sum [& args]
    {:pre [(every? (fn [arg] (or (vector? arg) (number? arg))) args)]
     :post [(or (vector? %) (number? %))]}
    (if (number? (first args))
      (apply func args)
      (apply mapv sum args))))

(def s+ (shapeless-op +))
(def s- (shapeless-op -))
(def s* (shapeless-op *))
(def sd (shapeless-op /))
