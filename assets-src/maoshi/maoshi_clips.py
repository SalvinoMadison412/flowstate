"""
maoshi_clips.py  -  authors every Maoshi animation clip and exports the web GLB.

Run (Blender 4.2+ / 5.x):
    blender -b maoshi_web.blend -P maoshi_clips.py -- out=maoshi.glb
or with the pip `bpy` module:
    python3 maoshi_clips.py out=maoshi.glb        (expects maoshi_web.blend in cwd)

POSE DSL (all angles in degrees, rotations in ARMATURE space, relative to the T-pose rest):
    Arms rest pointing sideways (Left = +X, Right = -X). Character faces -Y (towards camera).
    LeftArm  : ('Y', +a) lowers it   ('Y', -a) raises it   ('Z', -a) swings it forward
    RightArm : ('Y', -a) lowers it   ('Y', +a) raises it   ('Z', +a) swings it forward
    Head/Spine: ('X', +a) nods forward/down   ('Z', +a) turns to the character's LEFT (viewer's right)
                ('Y', +a) tilts/rolls
    Legs (UpLeg/Leg): ('X', -a) swings forward, ('X', +a) back
Each key = (frame, pose_dict, hips_z_metres, hips_scale) ; hips_scale = (xz, y) e.g. sq(0.08) squash.
STYLE RULES: arms stay almost straight (ForeArm <= 15 deg), hands never inside the head
(head occupies z 0.54-1.0, half-width 0.28), every loop clip ends on its first key.
"""
import bpy, math, os, sys
from mathutils import Matrix, Vector as V

args = dict(a.split('=', 1) for a in sys.argv if '=' in a and not a.startswith('-'))
OUT = os.path.abspath(args.get('out', 'maoshi.glb'))
if not bpy.data.objects.get('MaoshiRig'):
    bpy.ops.wm.open_mainfile(filepath=os.path.abspath('maoshi_web.blend'))

rig = bpy.data.objects['MaoshiRig']
P = 'mixamorig:'
AX = {'X': V((1, 0, 0)), 'Y': V((0, 1, 0)), 'Z': V((0, 0, 1))}
ALL = [b.name[len(P):] for b in rig.data.bones]
HIPR = rig.data.bones[P + 'Hips'].matrix_local.to_3x3()

for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)

def R(*rots):
    m = Matrix.Identity(3)
    for ax, deg in rots:
        m = Matrix.Rotation(math.radians(deg), 3, AX[ax]) @ m
    return m

def local_q(bone, Rw):
    r = rig.data.bones[P + bone].matrix_local.to_3x3()
    return (r.inverted() @ Rw @ r).to_quaternion()

BASE = {'LeftArm': [('Y', 55), ('Z', -12)], 'RightArm': [('Y', -55), ('Z', 12)]}
def pose(*overs):
    p = {k: list(v) for k, v in BASE.items()}
    for o in overs:
        p.update(o)
    return p
def sq(a): return (1 + a * 0.5, 1 - a)          # + squash, - stretch
S1 = (1, 1)

def make(name, keys):
    act = bpy.data.actions.new(name); act.use_fake_user = True
    rig.animation_data_create(); rig.animation_data.action = act
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    for f, p, z, s in keys:
        for b in ALL:
            pb = rig.pose.bones[P + b]
            pb.rotation_quaternion = local_q(b, R(*p.get(b, [])))
            pb.keyframe_insert('rotation_quaternion', frame=f, group=pb.name)
        hb = rig.pose.bones[P + 'Hips']
        hb.location = HIPR.inverted() @ V((0, 0, z)); hb.keyframe_insert('location', frame=f, group=hb.name)
        hb.scale = (s[0], s[1], s[0]); hb.keyframe_insert('scale', frame=f, group=hb.name)

# ---------- reusable pose fragments ----------
def legs(a):  return {'LeftUpLeg': [('X', -a)], 'RightUpLeg': [('X', -a)], 'LeftLeg': [('X', 2 * a)], 'RightLeg': [('X', 2 * a)]}
def cheer(a): return {'LeftArm': [('Y', -a), ('Z', -10)], 'RightArm': [('Y', a), ('Z', 10)], 'Head': [('X', -8)]}
ARMS_UP   = {'LeftArm': [('Y', 15), ('Z', -5)], 'RightArm': [('Y', -15), ('Z', 5)]}
ARMS_BACK = {'LeftArm': [('Y', 62), ('Z', 15)], 'RightArm': [('Y', -62), ('Z', -15)]}
# boxing
GUARD = {'LeftArm': [('Y', -4), ('Z', -68)], 'RightArm': [('Y', 4), ('Z', 66)], 'Spine2': [('Z', -12)],
         'Head': [('X', 7)], 'LeftUpLeg': [('X', -10)], 'RightUpLeg': [('X', 8)]}
def g(**extra):
    d = dict(GUARD); d.update(extra); return d
JAB   = g(LeftArm=[('Y', -10), ('Z', -94)], Spine2=[('Z', -24)])
CROSS = g(RightArm=[('Y', 10), ('Z', 94)], Spine2=[('Z', 22)], Spine1=[('Z', 8)])
UPPER = g(RightArm=[('Y', 48), ('Z', 62)], Spine2=[('Z', 10)], Head=[('X', -6)])
# hanging (hands up beside the head, gripping the nav edge)
HANG = {'LeftArm': [('Y', -48), ('Z', -8)], 'RightArm': [('Y', 48), ('Z', 8)], 'Head': [('X', 6)]}
def hang(lk=0, rk=0, **extra):
    d = dict(HANG); d.update({'LeftUpLeg': [('X', lk)], 'RightUpLeg': [('X', rk)]}); d.update(extra); return d

# ---------- clips ----------
# Home hero / general
make('Idle', [(0, pose(), 0, S1),
    (18, pose({'Head': [('Y', 2.5)], 'LeftArm': [('Y', 52), ('Z', -12)], 'RightArm': [('Y', -52), ('Z', 12)]}), 0.004, sq(-0.015)),
    (36, pose(), 0, S1),
    (54, pose({'Head': [('Y', -2.5)], 'LeftArm': [('Y', 52), ('Z', -12)], 'RightArm': [('Y', -52), ('Z', 12)]}), 0.004, sq(-0.015)),
    (72, pose(), 0, S1)])
make('PopIn', [(0, pose(cheer(20)), 0, (0.05, 0.05)), (9, pose(cheer(40)), 0.03, (1.05, 1.18)),
    (14, pose(cheer(25)), 0, (1.1, 0.88)), (19, pose(), 0.004, (0.98, 1.03)), (24, pose(), 0, S1)])
up = lambda a: {'RightArm': [('Y', a), ('Z', 32)], 'RightForeArm': [('Y', 8)], 'Head': [('Y', -6), ('Z', -6)], 'Spine1': [('Y', -3)]}
make('Wave', [(0, pose(), 0, S1), (8, pose(up(40)), 0.003, S1), (14, pose(up(22)), 0, S1), (20, pose(up(48)), 0.003, S1),
    (26, pose(up(22)), 0, S1), (32, pose(up(48)), 0.003, S1), (40, pose(up(35)), 0, S1), (48, pose(), 0, S1)])
make('Hop', [(0, pose(), 0, S1), (5, pose(legs(12), ARMS_BACK, {'Head': [('X', 6)]}), -0.02, sq(0.08)),
    (10, pose(ARMS_UP, {'Head': [('X', -4)]}), 0.07, sq(-0.07)), (15, pose(legs(18), ARMS_UP), 0.10, S1),
    (21, pose(legs(10), {'LeftArm': [('Y', 68), ('Z', -10)], 'RightArm': [('Y', -68), ('Z', 10)], 'Head': [('X', 5)]}), -0.018, sq(0.09)),
    (26, pose(), 0.004, sq(-0.03)), (30, pose(), 0, S1)])
pt = lambda yaw, f, d, nod: {'Spine2': [('Z', yaw * 0.6)], 'Head': [('X', nod), ('Z', yaw)], 'RightArm': [('Y', d), ('Z', f)], 'RightForeArm': [('Y', -4)]}
make('Point', [(0, pose(), 0, S1), (7, pose(pt(-10, 10, -30, -3)), 0.003, sq(-0.02)), (13, pose(pt(-24, 38, 10, 9)), 0, S1),
    (17, pose(pt(-20, 34, 6, 7)), 0, S1), (40, pose(pt(-21, 35, 7, 8)), 0, S1)])
make('Happy', [(0, pose(), 0, S1), (5, pose(legs(10), cheer(10)), -0.015, sq(0.07)), (11, pose(cheer(45)), 0.06, sq(-0.06)),
    (17, pose(legs(8), cheer(25)), -0.012, sq(0.06)), (23, pose(cheer(50)), 0.05, sq(-0.05)), (29, pose(legs(8), cheer(20)), -0.01, sq(0.05)),
    (34, pose(), 0.003, S1), (40, pose(), 0, S1)])
# Voice states
li = lambda r: {'Spine1': [('X', 6)], 'Head': [('X', 7), ('Y', r)], 'LeftArm': [('Y', 52), ('Z', -20)], 'RightArm': [('Y', -52), ('Z', 20)]}
make('Listen', [(0, pose(li(12)), 0, S1), (30, pose(li(8)), 0.003, sq(-0.012)), (60, pose(li(12)), 0, S1)])
th = lambda y, r: {'Head': [('X', -12), ('Z', y)], 'Spine1': [('Y', r)], 'RightArm': [('Y', -25), ('Z', 100)], 'RightForeArm': [('Y', 15)], 'LeftArm': [('Y', 55), ('Z', -12)]}
make('Think', [(0, pose(th(-18, 2)), 0, S1), (36, pose(th(-11, -2)), 0.003, S1), (72, pose(th(-18, 2)), 0, S1)])
tk = lambda n, la, ra: {'Head': [('X', n)], 'LeftArm': [('Y', 55 - la), ('Z', -12 - la / 2)], 'RightArm': [('Y', -55 + ra), ('Z', 12 + ra / 2)]}
make('Talk', [(0, pose(tk(0, 0, 0)), 0, S1), (7, pose(tk(4, 10, 0)), 0.006, sq(-0.03)), (15, pose(tk(-2, 0, 0)), 0, sq(0.02)),
    (22, pose(tk(3, 0, 10)), 0.005, sq(-0.03)), (30, pose(tk(0, 0, 0)), 0, S1)])
make('Nod', [(0, pose(), 0, S1), (6, pose({'Head': [('X', 12)]}), -0.004, sq(0.02)), (12, pose({'Head': [('X', -2)]}), 0, S1),
    (15, pose({'Head': [('X', 8)]}), 0, S1), (20, pose(), 0, S1)])
# Voice-agent page: boxing entrance + ready loop
make('BoxingIntro', [
    (0, pose(), 0, S1), (6, pose(legs(10), ARMS_BACK), -0.02, sq(0.07)),
    (12, pose(GUARD), 0.01, sq(-0.04)), (18, pose(GUARD), 0, sq(0.04)), (24, pose(GUARD), 0.012, sq(-0.03)),
    (28, pose(JAB), 0.004, S1), (32, pose(GUARD), 0, sq(0.03)), (36, pose(JAB), 0.004, S1), (40, pose(GUARD), 0.01, S1),
    (46, pose(CROSS), 0.004, sq(-0.03)), (52, pose(GUARD), 0, sq(0.04)),
    (56, pose(legs(8), GUARD), -0.015, sq(0.06)), (61, pose(UPPER), 0.035, sq(-0.08)), (67, pose(GUARD), 0, sq(0.05)),
    (74, pose(GUARD), 0.012, S1), (80, pose(cheer(40), {'Head': [('X', -6), ('Y', 8)]}), 0.03, sq(-0.05)),
    (88, pose(cheer(35), {'Head': [('X', -4), ('Y', 6)]}), 0, sq(0.04)), (96, pose(GUARD), 0, S1)])
make('BoxReady', [(0, pose(GUARD), 0, S1), (6, pose(GUARD), 0.014, sq(-0.03)), (12, pose(GUARD), 0, sq(0.03)),
    (18, pose(GUARD), 0.014, sq(-0.03)), (24, pose(GUARD), 0, S1)])
# Scroll: jump up, cling to the nav edge, hang, peek, point, wave, drop back down
make('JumpGrab', [(0, pose(), 0, S1), (4, pose(legs(12), ARMS_BACK), -0.02, sq(0.08)),
    (9, pose(hang(-10, 10)), 0.08, sq(-0.08)), (14, pose(hang(12, -8)), 0.02, sq(-0.03)), (20, pose(hang(-4, 4)), 0, sq(-0.02))])
make('HangIdle', [(0, pose(hang(-8, 6)), 0, sq(-0.02)), (15, pose(hang(-2, 0, Spine=[('Y', 2)])), 0, sq(-0.025)),
    (30, pose(hang(6, -8)), 0, sq(-0.02)), (45, pose(hang(0, -2, Spine=[('Y', -2)])), 0, sq(-0.025)), (60, pose(hang(-8, 6)), 0, sq(-0.02))])
make('HangPeek', [(0, pose(hang(-4, 4)), 0, sq(-0.02)), (10, pose(hang(-14, -12, Head=[('X', 24), ('Z', -12)])), 0, sq(-0.03)),
    (40, pose(hang(-12, -14, Head=[('X', 22), ('Z', -16)])), 0, sq(-0.03))])
hp = lambda a: hang(-4, 4, RightArm=[('Y', a), ('Z', 40)], Head=[('X', 14), ('Z', -18)])
make('HangPoint', [(0, pose(hang(-4, 4)), 0, sq(-0.02)), (8, pose(hp(10)), 0, sq(-0.03)), (13, pose(hp(-24)), 0, S1),
    (17, pose(hp(-18)), 0, S1), (36, pose(hp(-20)), 0, S1)])
hw = lambda a: hang(-4, 4, RightArm=[('Y', a), ('Z', 30)], Head=[('Y', -6)])
make('HangWave', [(0, pose(hang(-4, 4)), 0, sq(-0.02)), (8, pose(hw(25)), 0, S1), (14, pose(hw(5)), 0, S1), (20, pose(hw(30)), 0, S1),
    (26, pose(hw(5)), 0, S1), (32, pose(hw(28)), 0, S1), (40, pose(hang(-4, 4)), 0, sq(-0.02))])
make('DropLand', [(0, pose(hang(-4, 4)), 0, sq(-0.02)), (5, pose(hang(-10, 10, LeftArm=[('Y', -62)], RightArm=[('Y', 62)])), 0.02, sq(-0.06)),
    (11, pose(cheer(30)), 0, (0.95, 1.08)), (15, pose(legs(12), ARMS_BACK), -0.022, sq(0.1)), (20, pose(), 0.004, sq(-0.02)), (24, pose(), 0, S1)])

# ---------- export: one NLA track per clip ----------
ad = rig.animation_data
for t in list(ad.nla_tracks):
    ad.nla_tracks.remove(t)
for a in bpy.data.actions:
    tr = ad.nla_tracks.new(); tr.name = a.name
    st = tr.strips.new(a.name, int(a.frame_range[0]), a)
    try: st.action_slot = a.slots[0]
    except Exception: pass
ad.action = None
for o in bpy.data.objects:                       # hidden objects are silently skipped by the exporter
    o.hide_set(False); o.hide_viewport = False
    o.select_set(o.name in ('maoshi', 'MaoshiRig', 'Eye_L', 'Eye_R'))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_animation_mode='NLA_TRACKS',
    export_force_sampling=True, export_optimize_animation_size=True, export_def_bones=True, export_yup=True, export_apply=False)
bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath('maoshi_web.blend'))
print('EXPORTED', OUT, os.path.getsize(OUT), sorted(a.name for a in bpy.data.actions))
