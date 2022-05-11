
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

(defn division [& args]
  (if (== (count args) 1)
    (/ 1.0 (first args))
    (/ (first args) (double (apply * (rest args))))))
(def divide (operation division))

(def negate subtract)

(defn pi [arg] Math/PI)
(defn e [arg] Math/E)
(def sinh (operation (fn [arg] (Math/sinh arg))))
(def cosh (operation (fn [arg] (Math/cosh arg))))

(def pow (operation (fn [a b] (Math/pow a b))))
(defn abs [arg] (if (neg? arg) (- arg) arg))
(def log (operation (fn [a b] (/ (Math/log (abs b)) (Math/log (abs a))))))

(defn parserGen [cnst vrbl constants operations]
  (fn [source]
    (letfn [(parse [expression]
      (cond
        (number? expression) (cnst expression)
        (symbol? expression) (get constants expression (vrbl (str expression)))
        (list? expression) (apply (get operations (first expression)) (mapv parse (rest expression)))))]
      (parse (read-string source)))))

(def parseFunction
  (parserGen constant variable
    {'e e, 'pi pi}
    {'+ add, '- subtract, '* multiply, '/ divide,
     'negate negate, 'pow pow, 'log log,
     'sinh sinh, 'cosh cosh}))


;; hw-11

(load-file "proto.clj")

(declare Constant Variable Add Subtract Multiply Divide Negate Pow Log)

(def evaluate (method :evaluate))
(def toString (method :toString))
(def diff (method :diff))

(defclass Constant _ [value]
  (evaluate [variables] (proto-get this :value))
  (toString []     (str (proto-get this :value)))
  (diff     [arg]  (Constant 0)))

(def E (Constant Math/E))

(defclass Variable _ [name]
  (evaluate [variables] (get variables (proto-get this :name)))
  (toString []     (proto-get this :name))
  (diff     [arg]  (if (= (proto-get this :name) arg)
                     (Constant 1)
                     (Constant 0))))

(def OperationPrototype
  {:evaluate (fn [this variables]
    (apply (proto-get this :_func) (mapv (fn [arg] (evaluate arg variables)) (proto-get this :args))))
   :toString (fn [this]
     (str "(" (proto-get this :_sign) " " (clojure.string/join " " (mapv toString (proto-get this :args))) ")"))
   :diff (fn [this vArIaBlE] (apply (partial (proto-get this :_diff) vArIaBlE) (proto-get this :args)))})

(defn Operation [this & args] (assoc this :args args))

(defn OperationConstructor [_sign _func _diff]
  (constructor Operation
               (assoc OperationPrototype
                 :_sign _sign
                 :_func _func
                 :_diff _diff)))

(def Add (OperationConstructor '+ + 
  (fn [v & args] (apply Add (mapv (fn [arg] (diff arg v)) args)))))
(def Subtract (OperationConstructor '- -
  (fn [v & args] (apply Subtract (mapv (fn [arg] (diff arg v)) args)))))
(def Negate (OperationConstructor 'negate -
  (fn [v arg] (Negate (diff arg v)))))

(def Multiply (OperationConstructor '* *
  (fn [v & args] (if (== (count args) 1)
    (diff (first args) v)
    (apply
      (fn [& args2]
        (Add
          (Multiply (diff (first args2) v) (apply Multiply (rest args2)))
          (Multiply (first args2) (diff (apply Multiply (rest args2)) v))))
      args)))))

(def Divide (OperationConstructor '/ division
  (fn [v & args] (if (== (count args) 1)
    (Divide
      (Negate (diff (first args) v))
      (Multiply (first args) (first args)))
    (apply
      (fn [& args2]
        (Divide
          (Subtract
            (Multiply (diff (first args2) v) (apply Multiply (rest args2)))
            (Multiply (first args2) (diff (apply Multiply (rest args2)) v)))
          (Multiply (apply Multiply (rest args2)) (apply Multiply (rest args2))))) args)))))

(def Log (OperationConstructor 'log (fn [a b] (/ (Math/log (abs b)) (Math/log (abs a))))
  (fn [v a b]
    (Subtract
      (Divide (diff b v) (Multiply (Log E a) b))
      (Divide
        (Multiply (diff a v) (Log E b))
        (Multiply a (Log E a) (Log E a)))))))

(def Pow (OperationConstructor 'pow (fn [a b] (Math/pow a b))
  (fn [v a b]
    (Multiply
      (Pow a b)
      (Add
        (Multiply (diff b v) (Log E a))
        (Divide (Multiply (diff a v) b) a))))))

(def parseObject
  (parserGen Constant Variable
    {'e E}
    {'+ Add, '- Subtract, '* Multiply, '/ Divide,
     'negate Negate, 'pow Pow, 'log Log}))
