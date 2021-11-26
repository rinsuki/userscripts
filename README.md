# userscripts

ビルド成果物が https://github.com/rinsuki/userscripts/tree/dist にあります

## How to develop

needs: ViolentMonkeyが入ったブラウザ, Node.js, Yarn

1. `yarn dev` をすると watch & HTTPサーバーが起動します
1. http://localhost:9191/ を開いて開発したい user.js を開くと ViolentMonkey のインストール画面が開くはずです
1. 「このページを閉じるまでローカルファイルの変更を監視する」にチェックを入れてからインストールします
1. そのタブを放っておいてソースコードを変更します
1. 自動でビルドされて数秒後に ViolentMonkey が更新を感知するはずです (ViolentMonkey が更新を取得するとrollupのビルドログのあとにリクエストログが流れます)
1. Have fun!

:warning: scripts/*/banner.js の更新は感知されないので rollup を手で回すか適当に src/ の下をいじるとかしてください

## LICENSE

MIT License.
