use criterion::{black_box, criterion_group, criterion_main, Criterion};
use holophonix_animator_core::{
    animation::{
        models::MotionModel,
        motion::{LinearMotion, CircularMotion, CircularPlane, CompositeMotion},
    },
    math::vector::Vector3,
};
use std::time::Duration;

fn bench_linear_motion(c: &mut Criterion) {
    let motion = LinearMotion::new(
        Vector3::new(0.0, 0.0, 0.0),
        Vector3::new(1.0, 1.0, 1.0),
        Duration::from_secs(1),
    );

    c.bench_function("linear_motion_calculation", |b| {
        b.iter(|| {
            for i in 0..100 {
                let time = Duration::from_micros(black_box(i));
                black_box(motion.calculate_position(time));
            }
        })
    });
}

fn bench_circular_motion(c: &mut Criterion) {
    let motion = CircularMotion::new(
        Vector3::new(0.0, 0.0, 0.0),
        1.0,
        1.0,
        CircularPlane::XY,
    );

    c.bench_function("circular_motion_calculation", |b| {
        b.iter(|| {
            for i in 0..100 {
                let time = Duration::from_micros(black_box(i));
                black_box(motion.calculate_position(time));
            }
        })
    });
}

fn bench_composite_simple_vs_complex(c: &mut Criterion) {
    let mut group = c.benchmark_group("Simple vs Complex Composition");

    // Simple: Two linear motions
    let simple_composite = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    // Complex: Linear + Circular + Linear
    let complex_composite = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(CircularMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            1.0,
            1.0,
            CircularPlane::XY,
        )) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    group.bench_function("Simple Composition", |b| {
        b.iter(|| {
            black_box(simple_composite.calculate_position(Duration::from_secs_f64(0.5)))
        })
    });

    group.bench_function("Complex Composition", |b| {
        b.iter(|| {
            black_box(complex_composite.calculate_position(Duration::from_secs_f64(0.5)))
        })
    });

    group.finish();
}

fn bench_composite_nested_vs_flat(c: &mut Criterion) {
    let mut group = c.benchmark_group("Nested vs Flat Composition");

    // Flat: Three linear motions in one composite
    let flat_composite = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    // Nested: (A + B) + C structure
    let nested_composite = CompositeMotion::new(vec![
        Box::new(CompositeMotion::new(vec![
            Box::new(LinearMotion::new(
                Vector3::new(0.0, 0.0, 0.0),
                Vector3::new(1.0, 0.0, 0.0),
                Duration::from_secs(1),
            )) as Box<dyn MotionModel>,
            Box::new(LinearMotion::new(
                Vector3::new(0.0, 0.0, 0.0),
                Vector3::new(0.0, 1.0, 0.0),
                Duration::from_secs(1),
            )) as Box<dyn MotionModel>,
        ])) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 0.0, 1.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    group.bench_function("Flat Composition", |b| {
        b.iter(|| {
            black_box(flat_composite.calculate_position(Duration::from_secs_f64(0.5)))
        })
    });

    group.bench_function("Nested Composition", |b| {
        b.iter(|| {
            black_box(nested_composite.calculate_position(Duration::from_secs_f64(0.5)))
        })
    });

    group.finish();
}

fn bench_composite_motion_types(c: &mut Criterion) {
    let mut group = c.benchmark_group("Motion Type Combinations");

    // All linear motions
    let all_linear = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(0.0, 1.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    // All circular motions
    let all_circular = CompositeMotion::new(vec![
        Box::new(CircularMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            1.0,
            1.0,
            CircularPlane::XY,
        )) as Box<dyn MotionModel>,
        Box::new(CircularMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            1.0,
            1.0,
            CircularPlane::YZ,
        )) as Box<dyn MotionModel>,
    ]);

    // Mixed linear and circular
    let mixed = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
        Box::new(CircularMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            1.0,
            1.0,
            CircularPlane::XY,
        )) as Box<dyn MotionModel>,
    ]);

    group.bench_function("All Linear", |b| {
        b.iter(|| black_box(all_linear.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("All Circular", |b| {
        b.iter(|| black_box(all_circular.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("Mixed Linear and Circular", |b| {
        b.iter(|| black_box(mixed.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.finish();
}

fn bench_composite_empty_vs_nonempty(c: &mut Criterion) {
    let mut group = c.benchmark_group("Empty vs Non-Empty");

    let empty = CompositeMotion::new(vec![]);

    let non_empty = CompositeMotion::new(vec![
        Box::new(LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 0.0, 0.0),
            Duration::from_secs(1),
        )) as Box<dyn MotionModel>,
    ]);

    group.bench_function("Empty Composite", |b| {
        b.iter(|| black_box(empty.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("Non-Empty Composite", |b| {
        b.iter(|| black_box(non_empty.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.finish();
}

fn bench_coordinate_conversions(c: &mut Criterion) {
    let mut group = c.benchmark_group("Coordinate System Conversions");
    
    // Test points at various positions
    let xyz_points = vec![
        Vector3::new(1.0, 0.0, 0.0),  // On x-axis
        Vector3::new(0.0, 1.0, 0.0),  // On y-axis
        Vector3::new(0.0, 0.0, 1.0),  // On z-axis
        Vector3::new(1.0, 1.0, 1.0),  // Diagonal
        Vector3::new(0.5, -0.5, 0.25), // Mixed signs
    ];

    // Convert to AED and back
    group.bench_function("XYZ to AED", |b| {
        b.iter(|| {
            for point in &xyz_points {
                black_box(point.to_aed());
            }
        })
    });

    let aed_points: Vec<_> = xyz_points.iter().map(|p| p.to_aed()).collect();
    
    group.bench_function("AED to XYZ", |b| {
        b.iter(|| {
            for point in &aed_points {
                let (azimuth, elevation, distance) = *point;
                black_box(Vector3::from_aed(azimuth, elevation, distance));
            }
        })
    });

    group.finish();
}

fn bench_motion_coordinate_systems(c: &mut Criterion) {
    let mut group = c.benchmark_group("Motion in Different Coordinate Systems");
    
    // Linear motion in XYZ
    let linear_xyz = LinearMotion::new(
        Vector3::new(0.0, 0.0, 0.0),
        Vector3::new(1.0, 1.0, 1.0),
        Duration::from_secs(1),
    );

    // Linear motion defined in AED
    let start_aed = Vector3::new(0.0, 0.0, 0.0); // azimuth, elevation, distance
    let end_aed = Vector3::new(45.0_f64.to_radians(), 30.0_f64.to_radians(), 2.0);
    let linear_aed = LinearMotion::new(
        Vector3::from_aed(start_aed.x, start_aed.y, start_aed.z),
        Vector3::from_aed(end_aed.x, end_aed.y, end_aed.z),
        Duration::from_secs(1),
    );

    // Circular motion in XY plane
    let circular_xy = CircularMotion::new(
        Vector3::new(0.0, 0.0, 0.0),
        1.0,
        1.0,
        CircularPlane::XY,
    );

    // Circular motion in AED (varying azimuth)
    let circular_aed = CircularMotion::new(
        Vector3::new(0.0, 0.0, 1.0), // center point
        45.0_f64.to_radians(),       // radius in radians for azimuth
        1.0,                         // frequency
        CircularPlane::XY,           // still need a plane for internal calculations
    );

    group.bench_function("Linear XYZ", |b| {
        b.iter(|| black_box(linear_xyz.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("Linear AED", |b| {
        b.iter(|| black_box(linear_aed.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("Circular XY", |b| {
        b.iter(|| black_box(circular_xy.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.bench_function("Circular AED", |b| {
        b.iter(|| black_box(circular_aed.calculate_position(Duration::from_secs_f64(0.5))))
    });

    group.finish();
}

criterion_group!(
    benches,
    bench_linear_motion,
    bench_circular_motion,
    bench_composite_simple_vs_complex,
    bench_composite_nested_vs_flat,
    bench_composite_motion_types,
    bench_composite_empty_vs_nonempty,
    bench_coordinate_conversions,
    bench_motion_coordinate_systems
);
criterion_main!(benches);
