use criterion::{black_box, criterion_group, criterion_main, Criterion};
use holophonix_animator_core::math::vector::Vector3;

fn vector3_operations_benchmark(c: &mut Criterion) {
    // Basic operations should be under 1ms as per requirements
    let mut group = c.benchmark_group("Vector3 Operations");
    group.sample_size(1000); // Increase sample size for more accurate results
    
    let v1 = Vector3::new(1.0, 2.0, 3.0);
    let v2 = Vector3::new(4.0, 5.0, 6.0);

    // Addition benchmark
    group.bench_function("addition", |b| {
        b.iter(|| {
            black_box(v1 + v2);
        })
    });

    // Subtraction benchmark
    group.bench_function("subtraction", |b| {
        b.iter(|| {
            black_box(v1 - v2);
        })
    });

    // Scalar multiplication benchmark
    group.bench_function("scalar_multiplication", |b| {
        b.iter(|| {
            black_box(v1 * 2.0);
        })
    });

    group.finish();
}

fn vector3_computations_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("Vector3 Computations");
    group.sample_size(1000);

    let v1 = Vector3::new(1.0, 2.0, 3.0);
    let v2 = Vector3::new(4.0, 5.0, 6.0);

    // Dot product benchmark
    group.bench_function("dot_product", |b| {
        b.iter(|| {
            black_box(v1.dot(&v2));
        })
    });

    // Cross product benchmark
    group.bench_function("cross_product", |b| {
        b.iter(|| {
            black_box(v1.cross(&v2));
        })
    });

    // Magnitude benchmark
    group.bench_function("magnitude", |b| {
        b.iter(|| {
            black_box(v1.magnitude());
        })
    });

    group.finish();
}

fn vector3_transformations_benchmark(c: &mut Criterion) {
    let mut group = c.benchmark_group("Vector3 Transformations");
    group.sample_size(1000);

    let v = Vector3::new(3.0, 4.0, 5.0);

    // Normalization benchmark
    group.bench_function("normalize", |b| {
        b.iter(|| {
            black_box(v.normalize());
        })
    });

    let v2 = Vector3::new(6.0, 8.0, 10.0);
    
    // Distance benchmark
    group.bench_function("distance", |b| {
        b.iter(|| {
            black_box(v.distance(&v2));
        })
    });

    // Angle benchmark
    group.bench_function("angle", |b| {
        b.iter(|| {
            black_box(v.angle(&v2));
        })
    });

    group.finish();
}

criterion_group!(
    benches,
    vector3_operations_benchmark,
    vector3_computations_benchmark,
    vector3_transformations_benchmark
);
criterion_main!(benches);
