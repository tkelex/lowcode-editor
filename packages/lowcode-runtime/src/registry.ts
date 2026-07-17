import { builtinComponentSchemaRegistry } from '@lowcode/schema';
import Alert from './materials/Alert';
import Button from './materials/Button';
import Card from './materials/Card';
import Container from './materials/Container';
import Divider from './materials/Divider';
import Form from './materials/Form';
import FormItem from './materials/FormItem';
import Image from './materials/Image';
import Input from './materials/Input';
import Modal from './materials/Modal';
import Page from './materials/Page';
import Select from './materials/Select';
import Switch from './materials/Switch';
import Table from './materials/Table';
import TableColumn from './materials/TableColumn';
import Text from './materials/Text';
import {
  ChartProd,
  CheckboxProd,
  DatePickerProd,
  DescriptionsProd,
  DrawerProd,
  EmptyProd,
  FlexProd,
  GridProd,
  IconProd,
  LinkProd,
  ListProd,
  NotificationProd,
  PaginationProd,
  PopoverProd,
  RadioProd,
  RateProd,
  ResultProd,
  SpaceProd,
  StatisticProd,
  StepsProd,
  TabsProd,
  TextareaProd,
  TooltipProd,
  UploadProd,
} from './materials/p3';
import type { RuntimeComponentRegistry } from './types';

const productionComponents = {
  Alert,
  Button,
  Card,
  Container,
  Divider,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Page,
  Select,
  Switch,
  Table,
  TableColumn,
  Text,
  Chart: ChartProd,
  Checkbox: CheckboxProd,
  DatePicker: DatePickerProd,
  Descriptions: DescriptionsProd,
  Drawer: DrawerProd,
  Empty: EmptyProd,
  Flex: FlexProd,
  Grid: GridProd,
  Icon: IconProd,
  Link: LinkProd,
  List: ListProd,
  Notification: NotificationProd,
  Pagination: PaginationProd,
  Popover: PopoverProd,
  Radio: RadioProd,
  Rate: RateProd,
  Result: ResultProd,
  Space: SpaceProd,
  Statistic: StatisticProd,
  Steps: StepsProd,
  Tabs: TabsProd,
  Textarea: TextareaProd,
  Tooltip: TooltipProd,
  Upload: UploadProd,
};

export const builtinRuntimeRegistry: RuntimeComponentRegistry = Object.fromEntries(
  Object.entries(productionComponents).map(([name, component]) => [
    name,
    {
      component,
      acceptsChildren: Boolean(builtinComponentSchemaRegistry[name]?.acceptsChildren),
    },
  ]),
);
