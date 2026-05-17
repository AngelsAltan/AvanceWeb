from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash
from sqlalchemy import func, extract
from extensions import db
from models import User, Shipment

admin_bp = Blueprint("admin", __name__)


def _require_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user or user.rol != "admin":
        return None, (jsonify({"error": "Acceso denegado"}), 403)
    return user, None


# ── Métricas ──────────────────────────────────────────────────────────────────

@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    _, err = _require_admin()
    if err:
        return err

    total_usuarios = User.query.filter_by(rol="cliente").count()
    total_envios = Shipment.query.count()
    ingresos = db.session.query(func.sum(Shipment.costo_estimado)).scalar() or 0

    # Envíos por mes (últimos 12 meses)
    por_mes = (
        db.session.query(
            extract("year", Shipment.creado_en).label("anio"),
            extract("month", Shipment.creado_en).label("mes"),
            func.count(Shipment.id).label("total"),
        )
        .group_by("anio", "mes")
        .order_by("anio", "mes")
        .limit(12)
        .all()
    )

    # Envíos por estado
    por_estado = (
        db.session.query(Shipment.estado, func.count(Shipment.id))
        .group_by(Shipment.estado)
        .all()
    )

    # Envíos por servicio
    por_servicio = (
        db.session.query(Shipment.tipo_servicio, func.count(Shipment.id))
        .group_by(Shipment.tipo_servicio)
        .all()
    )

    # Envíos por estado (individuales)
    pendientes   = Shipment.query.filter_by(estado="pendiente").count()
    en_transito  = Shipment.query.filter_by(estado="en_tránsito").count()
    entregados   = Shipment.query.filter_by(estado="entregado").count()

    # Ticket promedio
    promedio = db.session.query(func.avg(Shipment.costo_estimado)).scalar() or 0

    # Peso total enviado
    peso_total = db.session.query(func.sum(Shipment.peso)).scalar() or 0

    # Tasa de entrega (entregados / total * 100)
    tasa_entrega = round((entregados / total_envios * 100), 1) if total_envios else 0

    # Ingresos express
    ingresos_express = db.session.query(
        func.sum(Shipment.costo_estimado)
    ).filter_by(tipo_servicio="express").scalar() or 0

    # Top 8 regiones (país extraído del campo destino "Estado, País")
    todos_destinos = db.session.query(Shipment.destino).all()
    regiones: dict = {}
    for (destino,) in todos_destinos:
        if destino and "," in destino:
            region = destino.split(",")[-1].strip()
        elif destino:
            region = destino.strip()
        else:
            region = "Desconocido"
        regiones[region] = regiones.get(region, 0) + 1
    top_regiones = dict(
        sorted(regiones.items(), key=lambda x: x[1], reverse=True)[:8]
    )

    return jsonify({
        "total_usuarios":    total_usuarios,
        "total_envios":      total_envios,
        "ingresos_totales":  round(float(ingresos), 2),
        "envios_pendientes": pendientes,
        "envios_transito":   en_transito,
        "envios_entregados": entregados,
        "ticket_promedio":   round(float(promedio), 2),
        "peso_total":        round(float(peso_total), 2),
        "tasa_entrega":      tasa_entrega,
        "ingresos_express":  round(float(ingresos_express), 2),
        "por_mes":    [{"anio": int(r.anio), "mes": int(r.mes), "total": r.total} for r in por_mes],
        "por_estado": {r[0]: r[1] for r in por_estado},
        "por_servicio": {r[0]: r[1] for r in por_servicio},
        "por_region": top_regiones,
    }), 200


# ── CRUD Usuarios ─────────────────────────────────────────────────────────────

@admin_bp.route("/usuarios", methods=["GET"])
@jwt_required()
def get_usuarios():
    _, err = _require_admin()
    if err:
        return err
    usuarios = User.query.order_by(User.creado_en.desc()).all()
    return jsonify([u.to_dict() for u in usuarios]), 200


@admin_bp.route("/usuarios", methods=["POST"])
@jwt_required()
def create_usuario():
    _, err = _require_admin()
    if err:
        return err
    data = request.get_json()
    if not all(k in data for k in ("nombre", "correo", "password")):
        return jsonify({"error": "Faltan campos requeridos"}), 400
    if User.query.filter_by(correo=data["correo"]).first():
        return jsonify({"error": "El correo ya está registrado"}), 409
    user = User(
        nombre=data["nombre"],
        correo=data["correo"],
        telefono=data.get("telefono", ""),
        direccion=data.get("direccion", ""),
        rol=data.get("rol", "cliente"),
        password_hash=generate_password_hash(data["password"]),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.route("/usuarios/<int:uid>", methods=["PUT"])
@jwt_required()
def update_usuario(uid):
    _, err = _require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    data = request.get_json()
    for field in ("nombre", "correo", "telefono", "direccion", "rol"):
        if field in data:
            setattr(user, field, data[field])
    if "password" in data and data["password"]:
        user.password_hash = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify(user.to_dict()), 200


@admin_bp.route("/usuarios/<int:uid>", methods=["DELETE"])
@jwt_required()
def delete_usuario(uid):
    _, err = _require_admin()
    if err:
        return err
    user = User.query.get_or_404(uid)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"mensaje": "Usuario eliminado"}), 200


# ── CRUD Envíos ───────────────────────────────────────────────────────────────

@admin_bp.route("/envios", methods=["GET"])
@jwt_required()
def get_envios():
    _, err = _require_admin()
    if err:
        return err
    envios = Shipment.query.order_by(Shipment.creado_en.desc()).all()
    result = []
    for e in envios:
        d = e.to_dict()
        d["usuario_nombre"] = e.usuario.nombre if e.usuario else "—"
        result.append(d)
    return jsonify(result), 200


@admin_bp.route("/envios/<int:eid>", methods=["PUT"])
@jwt_required()
def update_envio(eid):
    _, err = _require_admin()
    if err:
        return err
    envio = Shipment.query.get_or_404(eid)
    data = request.get_json()
    for field in ("destino", "peso", "tipo_servicio", "estado", "costo_estimado"):
        if field in data:
            setattr(envio, field, data[field])
    db.session.commit()
    return jsonify(envio.to_dict()), 200


@admin_bp.route("/envios/<int:eid>", methods=["DELETE"])
@jwt_required()
def delete_envio(eid):
    _, err = _require_admin()
    if err:
        return err
    envio = Shipment.query.get_or_404(eid)
    db.session.delete(envio)
    db.session.commit()
    return jsonify({"mensaje": "Envío eliminado"}), 200
