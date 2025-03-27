import bpy
import bmesh
from math import radians
import mathutils

# Limpa a cena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# Cria o material amarelo
yellow_material = bpy.data.materials.new(name="Yellow")
yellow_material.use_nodes = True
yellow_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (1, 0.8, 0, 1)  # Cor amarela
yellow_material.node_tree.nodes["Principled BSDF"].inputs[7].default_value = 0.2  # Roughness

# Função para adicionar material a um objeto
def add_material(obj, material):
    if obj.data.materials:
        obj.data.materials[0] = material
    else:
        obj.data.materials.append(material)

# Cria o corpo (vestido)
bpy.ops.mesh.primitive_cone_add(radius1=0.8, radius2=0.2, depth=1.4)
dress = bpy.context.active_object
dress.location = (0, 0, 0.7)
dress.scale = (1, 0.7, 1)
add_material(dress, yellow_material)

# Cria a cabeça
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22)
head = bpy.context.active_object
head.location = (0, 0, 1.45)
add_material(head, yellow_material)

# Cria os braços
def create_arm(x_pos):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.9)
    arm = bpy.context.active_object
    arm.location = (x_pos, 0, 1.2)
    arm.rotation_euler = (0, radians(90), 0)
    add_material(arm, yellow_material)
    return arm

left_arm = create_arm(-0.6)
right_arm = create_arm(0.6)

# Cria as pernas
def create_leg(x_pos):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.4)
    leg = bpy.context.active_object
    leg.location = (x_pos, 0, 0.2)
    add_material(leg, yellow_material)
    return leg

left_leg = create_leg(-0.12)
right_leg = create_leg(0.12)

# Adiciona detalhes do rosto
def create_eye(x_pos):
    bpy.ops.mesh.primitive_circle_add(radius=0.03, fill_type='TRIFAN')
    eye = bpy.context.active_object
    eye.location = (x_pos, 0.22, 1.45)
    eye.rotation_euler = (radians(90), 0, 0)
    
    # Material preto para os olhos
    black_material = bpy.data.materials.new(name="Black")
    black_material.use_nodes = True
    black_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0, 0, 0, 1)
    add_material(eye, black_material)
    return eye

left_eye = create_eye(-0.08)
right_eye = create_eye(0.08)

# Cria o sorriso
bpy.ops.curve.primitive_bezier_curve_add()
smile = bpy.context.active_object
smile.location = (0, 0.22, 1.40)
smile.rotation_euler = (radians(90), 0, 0)

# Ajusta os pontos da curva para formar um sorriso
curve = smile.data
curve.dimensions = '3D'
curve.resolution_u = 64
curve.bevel_depth = 0.015

# Ajusta os pontos de controle para formar um sorriso
points = curve.splines[0].bezier_points
points[0].co = mathutils.Vector((-0.1, 0, 0))
points[1].co = mathutils.Vector((0.1, 0, 0))
points[0].handle_right = mathutils.Vector((-0.05, 0, -0.03))
points[1].handle_left = mathutils.Vector((0.05, 0, -0.03))

# Material preto para o sorriso
add_material(smile, black_material)

# Adiciona o cabelo (franja)
def create_hair_strand(x_pos):
    bpy.ops.mesh.primitive_cube_add(size=0.04)
    strand = bpy.context.active_object
    strand.location = (x_pos, 0.15, 1.62)
    strand.scale = (1, 0.5, 1)
    add_material(strand, yellow_material)
    return strand

# Cria várias mechas de cabelo juntas para formar uma franja reta
hair_positions = [-0.18, -0.14, -0.10, -0.06, -0.02, 0.02, 0.06, 0.10, 0.14, 0.18]
hair_strands = [create_hair_strand(x) for x in hair_positions]

# Adiciona detalhes do vestido (costura central)
bpy.ops.mesh.primitive_cube_add(size=0.04)
seam = bpy.context.active_object
seam.location = (0, 0.35, 0.8)
seam.scale = (0.5, 0.1, 10)
add_material(seam, black_material)

# Agrupa todos os objetos
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.join()

# Adiciona um plano como base
bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=0.05)
base = bpy.context.active_object
base.location = (0, 0, 0)

# Material branco para a base
white_material = bpy.data.materials.new(name="White")
white_material.use_nodes = True
white_material.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (1, 1, 1, 1)
add_material(base, white_material)

# Configura a iluminação
bpy.ops.object.light_add(type='SUN')
sun = bpy.context.active_object
sun.location = (5, 5, 7)
sun.data.energy = 5

# Configura a câmera
bpy.ops.object.camera_add()
camera = bpy.context.active_object
camera.location = (3, -3, 3)
camera.rotation_euler = (radians(60), 0, radians(45))

# Configura o fundo azul claro
world = bpy.context.scene.world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.8, 0.9, 1, 1)

# Configura o render
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 128
bpy.context.scene.render.resolution_x = 1920
bpy.context.scene.render.resolution_y = 1080 