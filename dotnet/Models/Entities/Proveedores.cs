using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
namespace Api.Models.Entities
{
    [Table("proveedores")]
    public class Proveedor
    {
        [Key]
        [Column("pro_codigo")]
        public uint Codigo { get; set; }
        [Column("pro_razon")]
        public string? Razon { get; set; }
        [Column("pro_nombre_comun")]
        public string? NombreComun { get; set; }
        [Column("pro_ruc")]
        public string? Ruc { get; set; }
        [Column("pro_dir")]
        public string? Direccion { get; set; }
        [Column("pro_tel")]
        public string? Telefono { get; set; }
        [Column("pro_mail")]
        public string? Mail { get; set; }
        [Column("pro_obs")]
        public string? Observacion { get; set; }
        [Column("pro_moneda")]
        public uint Moneda { get; set; }
        [Column("pro_zona")]
        public uint ZonaId { get; set; }
        [Column("pro_estado")]
        public int Estado { get; set; }
        [Column("pais_extranjero")]
        public string? PaisExtranjero { get; set; }
        [Column("pro_plazo")]
        public uint Plazo { get; set; }
        [Column("pro_credito")]
        public uint Credito { get; set; }
        [Column("pro_tiponac")]
        public uint TipoNac { get; set; }
        [Column("pro_supervisor")]
        public string? Supervisor { get; set; }
        [Column("pro_telef_super")]
        public string? TelefonoSupervisor { get; set; }
        [Column("pro_vendedor")]
        public string? Vendedor { get; set; }
        [Column("pro_telef_vend")]
        public string? TelefonoVendedor { get; set; }
        [Column("pro_aplicar_gasto")]
        public uint AplicarGasto { get; set; }
        [Column("pro_plan")]
        public uint Plan { get; set; }
        [Column("pro_tipo_doc")]
        public uint TipoDoc { get; set; }

        [Column("pro_key")]
        public string? Key { get; set; }

        public virtual Zona? Zona { get; set; }
    }
}