mod utils;

use itertools::Itertools;
use js_sys;
use nalgebra::SVD;
use nalgebra::{DMatrix, Matrix4, Scalar};
use wasm_bindgen::prelude::*;

#[macro_use]
extern crate serde_derive;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn console_log(s: &str);
}

pub trait Matrices {
    fn matrix_count(self: &Self) -> u32;
    fn nth_matrix(self: &Self, n: u32) -> Matrix4<f32>;
}

impl Matrices for js_sys::Float32Array {
    fn matrix_count(self: &Self) -> u32 {
        self.length() / 16
    }

    fn nth_matrix(self: &Self, n: u32) -> Matrix4<f32> {
        assert!(n < self.matrix_count());

        Matrix4::new(
            self.get_index(16 * n + 0),
            self.get_index(16 * n + 4),
            self.get_index(16 * n + 8),
            self.get_index(16 * n + 12),
            self.get_index(16 * n + 1),
            self.get_index(16 * n + 5),
            self.get_index(16 * n + 9),
            self.get_index(16 * n + 13),
            self.get_index(16 * n + 2),
            self.get_index(16 * n + 6),
            self.get_index(16 * n + 10),
            self.get_index(16 * n + 14),
            self.get_index(16 * n + 3),
            self.get_index(16 * n + 7),
            self.get_index(16 * n + 11),
            self.get_index(16 * n + 15),
        )
    }
}

pub trait RowConcat: Sized {
    fn row_concat(self: &mut Self, matrices: Vec<Self>);
}

impl<T: Sized + Scalar> RowConcat for DMatrix<T> {
    fn row_concat(self: &mut Self, matrices: Vec<Self>) {
        let mut m = self.transpose();

        for other in matrices {
            m.extend(other.transpose().iter().cloned().collect::<Vec<_>>());
        }

        *self = m.transpose();
    }
}

#[allow(non_snake_case)]
#[wasm_bindgen]
pub fn getSBSCoR(
    bone_matrices: js_sys::Float32Array,
    joint_set_list_: &JsValue,
    bind_matrix: js_sys::Float32Array,
    bind_matrix_inverse: js_sys::Float32Array,
) -> JsValue {
    utils::set_panic_hook();

    let joint_set_list: Vec<Vec<u8>> = joint_set_list_.into_serde().unwrap();
    let mut index_list: Vec<u32> = vec![];
    let mut cor_list: Vec<Vec<f32>> = vec![];

    if bone_matrices.matrix_count() >= 4 {
        for joint_set in joint_set_list.iter() {
            let mut least_squares_coeff = DMatrix::<f32>::identity(0, 3);
            let mut least_squares_const = DMatrix::<f32>::identity(0, 1);

            for vpair in joint_set.into_iter().combinations(2) {
                let a: u8 = **vpair.first().unwrap();
                let b: u8 = **vpair.last().unwrap();
                let bone_matrix_a = bone_matrices.nth_matrix(a as u32);
                let bone_matrix_b = bone_matrices.nth_matrix(b as u32);
                let rot_a = DMatrix::from_iterator(
                    3,
                    3,
                    bone_matrix_a.fixed_slice::<3, 3>(0, 0).iter().cloned(),
                );
                let rot_b = DMatrix::from_iterator(
                    3,
                    3,
                    bone_matrix_b.fixed_slice::<3, 3>(0, 0).iter().cloned(),
                );
                let tr_a = DMatrix::from_iterator(
                    3,
                    1,
                    bone_matrix_a.fixed_slice::<3, 1>(0, 3).iter().cloned(),
                );
                let tr_b = DMatrix::from_iterator(
                    3,
                    1,
                    bone_matrix_b.fixed_slice::<3, 1>(0, 3).iter().cloned(),
                );

                least_squares_coeff.row_concat(vec![rot_a - rot_b]);
                least_squares_const.row_concat(vec![bind_matrix.nth_matrix(0) * (tr_a - tr_b)]);
            }

            let svd = SVD::new(least_squares_coeff.clone(), true, true);
            let mut r = DMatrix::<f32>::zeros(3, 1);
            let u = svd.u.clone().unwrap_or(DMatrix::<f32>::zeros(3, 3));
            let v = svd
                .v_t
                .clone()
                .unwrap_or(DMatrix::<f32>::zeros(3, 3))
                .transpose();
            for (i, &sigma_i) in svd.singular_values.iter().enumerate() {
                if sigma_i > 1e-15 {
                    let u_i = u.column(i);
                    r += u_i.dot(&least_squares_const) * v.column(i) / sigma_i;
                }
            }

            if r != DMatrix::<f32>::zeros(3, 1) {
                index_list.push(
                    joint_set
                        .iter()
                        .map(|&x| (x as u32) + 1)
                        .reduce(|a, b| 100 * a + b)
                        .unwrap_or(0),
                );
                cor_list.push((bind_matrix_inverse.nth_matrix(0) * r).iter().cloned().collect::<Vec<_>>());
            }
        }
    }

    JsValue::from_serde(&(index_list, cor_list)).unwrap()
}
