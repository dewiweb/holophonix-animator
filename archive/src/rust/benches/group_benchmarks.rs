use criterion::{black_box, criterion_group, criterion_main, Criterion};
use holophonix_animator_core::{
    state::{TrackRegistry, Group, GroupPattern},
    math::vector::Vector3,
};
use std::time::Duration;

fn bench_batch_position_updates(c: &mut Criterion) {
    let mut group = c.benchmark_group("batch_position_updates");
    
    // Test different group sizes
    for size in [10, 100, 1000].iter() {
        group.bench_function(format!("update_{}_positions", size), |b| {
            let mut registry = TrackRegistry::new();
            let mut test_group = Group::new("test", GroupPattern::All);
            
            // Setup tracks
            for i in 0..*size {
                let track_id = format!("track_{}", i);
                registry.add_track(track_id.clone());
                test_group.update_members(&registry);
            }
            
            b.iter(|| {
                black_box(test_group.update_positions(&mut registry, Duration::from_secs(1)));
            });
        });
    }
    group.finish();
}

criterion_group!(benches, bench_batch_position_updates);
criterion_main!(benches);
