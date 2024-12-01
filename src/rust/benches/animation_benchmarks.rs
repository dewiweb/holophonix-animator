use criterion::{black_box, criterion_group, criterion_main, Criterion};
use holophonix_animator_core::{
    animation::{AnimationManager, models::*},
    state::StateManagerWrapper,
    test_utils::{
        fixtures::{TestPositions, TestAnimations},
    },
};
use tokio::runtime::Runtime;

fn position_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("position_operations");
    
    let p1 = TestPositions::origin();
    let p2 = TestPositions::unit_x();
    
    group.bench_function("interpolate", |b| {
        b.iter(|| {
            black_box(p1.interpolate(&p2, 0.5));
        })
    });
    
    group.bench_function("distance", |b| {
        b.iter(|| {
            black_box(p1.distance(&p2));
        })
    });
    
    group.finish();
}

fn animation_updates(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    let mut group = c.benchmark_group("animation_updates");
    
    group.bench_function("single_animation", |b| {
        b.iter(|| {
            rt.block_on(async {
                let manager = AnimationManager::new();
                let config = TestAnimations::linear_1s();
                
                black_box(manager.add_animation("test", config).await.unwrap());
                black_box(manager.update(0.5).await.unwrap());
            })
        })
    });
    
    group.bench_function("group_animation", |b| {
        b.iter(|| {
            rt.block_on(async {
                let manager = AnimationManager::new();
                let configs = vec![
                    TestAnimations::linear_1s(),
                    TestAnimations::circular_2s(),
                ];
                
                for (i, config) in configs.iter().enumerate() {
                    black_box(manager.add_to_group("test_group", format!("track_{}", i), config.clone()).await.unwrap());
                }
                
                black_box(manager.update(0.5).await.unwrap());
            })
        })
    });
    
    group.finish();
}

fn state_synchronization(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    let mut group = c.benchmark_group("state_synchronization");
    
    group.bench_function("state_update", |b| {
        b.iter(|| {
            rt.block_on(async {
                let state = StateManagerWrapper::new();
                let position = TestPositions::unit_x();
                
                black_box(state.update_position("test", position).await.unwrap());
                black_box(state.get_position("test").await.unwrap());
            })
        })
    });
    
    group.bench_function("bulk_update", |b| {
        b.iter(|| {
            rt.block_on(async {
                let state = StateManagerWrapper::new();
                let positions = (0..100).map(|i| {
                    (format!("track_{}", i), TestPositions::unit_x())
                }).collect::<Vec<_>>();
                
                black_box(state.update_positions(positions).await.unwrap());
            })
        })
    });
    
    group.finish();
}

criterion_group!(benches, position_operations, animation_updates, state_synchronization);
criterion_main!(benches);
