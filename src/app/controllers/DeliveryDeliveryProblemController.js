import { Op } from 'sequelize';
import Delivery from '../models/Delivery';
import DeliveryProblem from '../models/DeliveryProblem';

class DeliveryDeliveryProblemController {
  async indexProblem(req, res) {
    const { page = 1 } = req.query;

    const deliverys = await Delivery.findAll({
      where: {
        start_date: {
          [Op.ne]: null,
        },
        canceled_at: null,
        end_date: null,
      },
      attributes: ['id', 'product', 'start_date', 'end_date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [DeliveryProblem],
    });

    if (deliverys.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhuma encomenda com problema' });
    }

    const deliverysRes = deliverys.filter(
      delivery => delivery.DeliveryProblems.length > 0
    );

    if (deliverysRes.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhuma encomenda com problema' });
    }

    return res.json({
      deliverysRes,
    });
  }

  async indexByIdProblem(req, res) {
    const { id } = req.params;
    const { page = 1 } = req.query;

    const delivery = await Delivery.findByPk(id, {
      include: { model: DeliveryProblem, limit: 10, offset: (page - 1) * 10 },
    });

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Id da encomenda enviado é inválido' });
    }

    if (delivery.DeliveryProblems.length < 1) {
      return res
        .status(400)
        .json({ error: 'Não foi encontrado nenhum problema na encomenda' });
    }

    return res.json({
      delivery,
    });
  }
}
export default new DeliveryDeliveryProblemController();
