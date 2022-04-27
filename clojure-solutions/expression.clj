
; hard PowLog

(defn constant [value] (fn [variables] value))
(defn variable [name] (fn [variables] (get variables name)))

(defn operation [func]
  (fn [& expressions]
    (fn [variables]
      (apply func (mapv (fn [expression] (expression variables)) expressions)))))

(def add (operation +))
(def subtract (operation -))
(def multiply (operation *))
(def divide (operation (fn [& args]
  (if (== (count args) 1)
    (/ 1.0 (first args))
    (/ (first args) (double (apply * (rest args))))))))
(def negate subtract)

; (defn pi [arg] Math/PI)
; (defn e [arg] Math/E)
; (def sinh (operation (fn [arg] (Math/sinh arg))))
; (def cosh (operation (fn [arg] (Math/cosh arg))))

(def pow (operation (fn [a b] (Math/pow a b))))

(defn abs [arg] (if (neg? arg) (- arg) arg))
(def log (operation (fn [a b] (/ (Math/log (abs b)) (Math/log (abs a))))))

(defn parseFunction [source]
  (letfn [(parse [expression]
    (let [constants {
                     ; 'e e, 'pi pi
                    }
          operations {'+ add, '- subtract, '* multiply, '/ divide, 'negate negate
                      ; 'sinh sinh, 'cosh cosh,
                      'pow pow, 'log log}]
      (cond
        (number? expression) (constant expression)
        (symbol? expression) (get constants expression (variable (str expression)))
        (list? expression) (apply (get operations (first expression)) (mapv parse (rest expression))))))]
    (parse (read-string source))))
