import EuclideanGeometry

open EuclideanGeometry

-- Premises
def A : Point := { label := "A" }
def B : Point := { label := "B" }
def C : Point := { label := "C" }
def D : Point := { label := "D" }
def t_ABC : Triangle := { a := A, b := B, c := C }
def t_ADC : Triangle := { a := A, b := D, c := C }

theorem goal : CongruentTriangles t_ABC t_ADC :=
  sorry
