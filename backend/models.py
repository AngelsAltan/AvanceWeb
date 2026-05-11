from extensions import db
from datetime import datetime, timezone


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(150), unique=True, nullable=False)
    telefono = db.Column(db.String(20))
    direccion = db.Column(db.String(255))
    password_hash = db.Column(db.String(255), nullable=False)
    rol = db.Column(db.String(20), default="cliente")
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    shipments = db.relationship("Shipment", backref="usuario", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "nombre": self.nombre,
            "correo": self.correo,
            "telefono": self.telefono,
            "direccion": self.direccion,
            "rol": self.rol,
            "creado_en": self.creado_en.isoformat(),
        }


class Shipment(db.Model):
    __tablename__ = "shipments"

    id = db.Column(db.Integer, primary_key=True)
    codigo_guia = db.Column(db.String(20), unique=True, nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    destino = db.Column(db.String(255), nullable=False)
    peso = db.Column(db.Float, nullable=False)
    tipo_servicio = db.Column(db.String(20), nullable=False)  # standard / express
    estado = db.Column(db.String(20), default="pendiente")
    costo_estimado = db.Column(db.Float, nullable=False)
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "codigo_guia": self.codigo_guia,
            "usuario_id": self.usuario_id,
            "destino": self.destino,
            "peso": self.peso,
            "tipo_servicio": self.tipo_servicio,
            "estado": self.estado,
            "costo_estimado": self.costo_estimado,
            "creado_en": self.creado_en.isoformat(),
        }


class Contact(db.Model):
    __tablename__ = "contacts"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(150), nullable=False)
    telefono = db.Column(db.String(20))
    mensaje = db.Column(db.Text, nullable=False)
    creado_en = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
